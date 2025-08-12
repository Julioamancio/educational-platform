// Enhanced Word document parser with robust error handling and image extraction

export interface ParsedQuestion {
  id: string
  title: string
  stem: string
  options: {
    A: string
    B: string
    C: string
    D: string
    E: string
  }
  correctAnswer: string
  explanation?: string
  difficulty: string
  tags: string[]
  images: string[]
}

export interface ParsingResult {
  questions: ParsedQuestion[]
  images: string[]
  errors: string[]
  warnings: string[]
  statistics: {
    totalQuestions: number
    questionsWithAnswers: number
    questionsWithImages: number
    questionsWithExplanations: number
    questionsWithTags: number
  }
}

/**
 * Enhanced Word document parser with support for multiple formats and image extraction
 */
export class WordDocumentParser {
  private mammoth: any = null

  async initialize() {
    if (!this.mammoth) {
      try {
        const mammothModule = await import('mammoth')
        this.mammoth = mammothModule.default || mammothModule
      } catch (error) {
        throw new Error('Failed to load document parser. Please try again.')
      }
    }
  }

  async parseDocument(file: File): Promise<ParsingResult> {
    const result: ParsingResult = {
      questions: [],
      images: [],
      errors: [],
      warnings: [],
      statistics: {
        totalQuestions: 0,
        questionsWithAnswers: 0,
        questionsWithImages: 0,
        questionsWithExplanations: 0,
        questionsWithTags: 0
      }
    }

    try {
      if (file.name.endsWith('.docx')) {
        await this.initialize()
        return await this.parseDocxFile(file, result)
      } else {
        return await this.parseTextFile(file, result)
      }
    } catch (error) {
      result.errors.push(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  private async parseDocxFile(file: File, result: ParsingResult): Promise<ParsingResult> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      
      // Extract text and HTML with images
      const [textResult, htmlResult] = await Promise.all([
        this.mammoth.extractRawText({ arrayBuffer }),
        this.mammoth.convertToHtml({ 
          arrayBuffer,
          convertImage: this.mammoth.images.imgElement((image: any) => {
            return image.read('base64').then((imageBuffer: string) => {
              const dataUrl = `data:${image.contentType};base64,${imageBuffer}`
              result.images.push(dataUrl)
              return { src: dataUrl }
            })
          }),
          styleMap: [
            "p[style-name='Question'] => h3.question",
            "p[style-name='Option'] => p.option",
            "p[style-name='Answer'] => p.answer"
          ]
        })
      ])

      const text = textResult.value
      const htmlContent = htmlResult.value

      if (textResult.messages?.length > 0) {
        result.warnings.push(...textResult.messages.map((m: any) => m.message))
      }

      result.questions = this.parseQuestionsFromText(text, result.images, result)
      return this.calculateStatistics(result)

    } catch (error) {
      result.errors.push(`Error parsing .docx file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  private async parseTextFile(file: File, result: ParsingResult): Promise<ParsingResult> {
    try {
      const text = await this.readFileAsText(file)
      result.questions = this.parseQuestionsFromText(text, [], result)
      return this.calculateStatistics(result)
    } catch (error) {
      result.errors.push(`Error reading text file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  private parseQuestionsFromText(text: string, images: string[], result: ParsingResult): ParsedQuestion[] {
    const questions: ParsedQuestion[] = []
    
    // Multiple parsing strategies for different formats
    const strategies = [
      this.parseNumberedQuestions.bind(this),
      this.parseQuestionAnswerFormat.bind(this),
      this.parseDirectQuestions.bind(this)
    ]

    let bestResult: ParsedQuestion[] = []
    let bestScore = 0

    for (const strategy of strategies) {
      try {
        const strategyResult = strategy(text, images, result)
        const score = this.scoreParsingResult(strategyResult)
        
        if (score > bestScore) {
          bestScore = score
          bestResult = strategyResult
        }
      } catch (error) {
        result.warnings.push(`Parsing strategy failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return bestResult
  }

  private parseNumberedQuestions(text: string, images: string[], result: ParsingResult): ParsedQuestion[] {
    const questions: ParsedQuestion[] = []
    const questionBlocks = text.split(/(?=\d+\.)/m).filter(block => block.trim())

    questionBlocks.forEach((block, index) => {
      try {
        const question = this.parseQuestionBlock(block, index, images, result)
        if (question) {
          questions.push(question)
        }
      } catch (error) {
        result.warnings.push(`Failed to parse question ${index + 1}: ${error instanceof Error ? error.message : 'Invalid format'}`)
      }
    })

    return questions
  }

  private parseQuestionAnswerFormat(text: string, images: string[], result: ParsingResult): ParsedQuestion[] {
    const questions: ParsedQuestion[] = []
    const questionBlocks = text.split(/(?=Question:|Q:)/gim).filter(block => block.trim())

    questionBlocks.forEach((block, index) => {
      try {
        const question = this.parseQABlock(block, index, images, result)
        if (question) {
          questions.push(question)
        }
      } catch (error) {
        result.warnings.push(`Failed to parse Q&A block ${index + 1}: ${error instanceof Error ? error.message : 'Invalid format'}`)
      }
    })

    return questions
  }

  private parseDirectQuestions(text: string, images: string[], result: ParsingResult): ParsedQuestion[] {
    const questions: ParsedQuestion[] = []
    const lines = text.split('\n').filter(line => line.trim())
    
    let currentBlock = ''
    let blockIndex = 0

    for (const line of lines) {
      if (line.includes('?') && !line.match(/^[A-E]\)/)) {
        if (currentBlock) {
          try {
            const question = this.parseQuestionBlock(currentBlock, blockIndex, images, result)
            if (question) {
              questions.push(question)
              blockIndex++
            }
          } catch (error) {
            result.warnings.push(`Failed to parse question block: ${error instanceof Error ? error.message : 'Invalid format'}`)
          }
        }
        currentBlock = line
      } else {
        currentBlock += '\n' + line
      }
    }

    // Process the last block
    if (currentBlock) {
      try {
        const question = this.parseQuestionBlock(currentBlock, blockIndex, images, result)
        if (question) {
          questions.push(question)
        }
      } catch (error) {
        result.warnings.push(`Failed to parse final question block: ${error instanceof Error ? error.message : 'Invalid format'}`)
      }
    }

    return questions
  }

  private parseQuestionBlock(block: string, index: number, images: string[], result: ParsingResult): ParsedQuestion | null {
    const lines = block.split('\n').filter(line => line.trim())
    
    if (lines.length < 3) return null

    // Extract question
    const firstLine = lines[0].trim()
    const questionMatch = firstLine.match(/^(?:\d+\.?\s*)?(.+)/)
    if (!questionMatch) return null

    let title = questionMatch[1].trim()
    let stem = title

    // Find question end (before options start)
    let questionEndIndex = 1
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (/^[A-E]\)/.test(line)) {
        questionEndIndex = i
        break
      }
      if (!line.match(/^(Correct Answer|Answer|Explanation|Difficulty|Tags):/i)) {
        stem += ' ' + line
      }
    }

    // Parse options and metadata
    const options = { A: '', B: '', C: '', D: '', E: '' }
    let correctAnswer = ''
    let explanation = ''
    let difficulty = 'A1'
    let tags: string[] = []

    for (let i = questionEndIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Parse options
      const optionMatch = line.match(/^([A-E])\)\s*(.+)/)
      if (optionMatch) {
        const letter = optionMatch[1] as keyof typeof options
        options[letter] = optionMatch[2].trim()
        continue
      }

      // Parse metadata
      const answerMatch = line.match(/^(?:Correct\s*)?Answer:\s*([A-E])/i)
      if (answerMatch) {
        correctAnswer = answerMatch[1].toUpperCase()
        continue
      }

      const explanationMatch = line.match(/^Explanation:\s*(.+)/i)
      if (explanationMatch) {
        explanation = explanationMatch[1]
        continue
      }

      const difficultyMatch = line.match(/^Difficulty:\s*(A[12]|B[12]|C[12])/i)
      if (difficultyMatch) {
        difficulty = difficultyMatch[1].toUpperCase()
        continue
      }

      const tagsMatch = line.match(/^Tags:\s*(.+)/i)
      if (tagsMatch) {
        tags = tagsMatch[1].split(',').map(tag => tag.trim()).filter(Boolean)
        continue
      }
    }

    // Validate and create question
    const validOptions = Object.values(options).filter(opt => opt.length > 0)
    if (validOptions.length < 2) {
      result.warnings.push(`Question ${index + 1}: Not enough valid options (found ${validOptions.length})`)
      return null
    }

    // Auto-detect correct answer if not specified
    if (!correctAnswer) {
      correctAnswer = this.detectCorrectAnswer(block, options)
      if (correctAnswer) {
        result.warnings.push(`Question ${index + 1}: Auto-detected correct answer as ${correctAnswer}`)
      } else {
        correctAnswer = Object.keys(options).find(k => options[k as keyof typeof options]) || 'A'
        result.warnings.push(`Question ${index + 1}: No correct answer specified, defaulting to ${correctAnswer}`)
      }
    }

    return {
      id: `imported-${Date.now()}-${index}`,
      title: title.length > 100 ? title.substring(0, 100) + '...' : title,
      stem: stem.trim(),
      options,
      correctAnswer,
      explanation,
      difficulty,
      tags,
      images: images.slice(index, index + 1)
    }
  }

  private parseQABlock(block: string, index: number, images: string[], result: ParsingResult): ParsedQuestion | null {
    // Similar logic but adapted for Q: A: format
    const questionMatch = block.match(/(?:Question|Q):\s*([^]*?)(?=Answer|A:|$)/i)
    const answerMatch = block.match(/(?:Answer|A):\s*([A-E])/i)
    
    if (!questionMatch) return null

    const questionText = questionMatch[1].trim()
    const correctAnswer = answerMatch?.[1]?.toUpperCase() || 'A'

    // Try to extract options from the question text
    const optionMatches = questionText.match(/[A-E]\)\s*[^)]+/g)
    const options = { A: '', B: '', C: '', D: '', E: '' }
    
    if (optionMatches) {
      optionMatches.forEach(match => {
        const optMatch = match.match(/([A-E])\)\s*(.+)/)
        if (optMatch) {
          options[optMatch[1] as keyof typeof options] = optMatch[2].trim()
        }
      })
    }

    const validOptions = Object.values(options).filter(opt => opt.length > 0)
    if (validOptions.length < 2) return null

    return {
      id: `imported-qa-${Date.now()}-${index}`,
      title: questionText.substring(0, 100) + (questionText.length > 100 ? '...' : ''),
      stem: questionText,
      options,
      correctAnswer,
      explanation: '',
      difficulty: 'A1',
      tags: [],
      images: images.slice(index, index + 1)
    }
  }

  private detectCorrectAnswer(text: string, options: Record<string, string>): string {
    const lowerText = text.toLowerCase()
    
    // Look for explicit answer indicators
    for (const [letter, option] of Object.entries(options)) {
      if (option && (
        lowerText.includes(`answer is ${letter.toLowerCase()}`) ||
        lowerText.includes(`answer: ${letter.toLowerCase()}`) ||
        lowerText.includes(`correct: ${letter.toLowerCase()}`) ||
        option.toLowerCase().includes('correct') ||
        option.toLowerCase().includes('right answer')
      )) {
        return letter
      }
    }

    return ''
  }

  private scoreParsingResult(questions: ParsedQuestion[]): number {
    let score = 0
    
    for (const question of questions) {
      score += 10 // Base score per question
      
      const validOptions = Object.values(question.options).filter(opt => opt.length > 0)
      score += validOptions.length * 2 // Score for each valid option
      
      if (question.correctAnswer) score += 5
      if (question.explanation) score += 3
      if (question.tags.length > 0) score += 2
      if (question.images.length > 0) score += 1
    }
    
    return score
  }

  private calculateStatistics(result: ParsingResult): ParsingResult {
    result.statistics = {
      totalQuestions: result.questions.length,
      questionsWithAnswers: result.questions.filter(q => q.correctAnswer).length,
      questionsWithImages: result.questions.filter(q => q.images && q.images.length > 0).length,
      questionsWithExplanations: result.questions.filter(q => q.explanation).length,
      questionsWithTags: result.questions.filter(q => q.tags && q.tags.length > 0).length
    }
    
    return result
  }
}

// Export singleton instance
export const wordParser = new WordDocumentParser()