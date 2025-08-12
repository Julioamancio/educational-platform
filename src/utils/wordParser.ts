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
        console.log('Mammoth library loaded successfully')
      } catch (error) {
        console.error('Failed to load mammoth library:', error)
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
    
    // Enhanced regex patterns for question detection
    const questionPatterns = [
      /(?=\d+\.)/m,           // Standard: 1. 2. 3.
      /(?=\d+\))/m,           // Alternative: 1) 2) 3)
      /(?=Question\s*\d+)/gim, // Question 1, Question 2
      /(?=Q\.?\d+)/gim,       // Q1, Q.1, Q2
      /(?=\d+\s*[-–—])/m      // 1 - question, 2 – question
    ]
    
    let bestSplit: string[] = []
    let bestScore = 0
    
    // Try different splitting patterns and choose the best one
    for (const pattern of questionPatterns) {
      const split = text.split(pattern).filter(block => block.trim())
      const score = this.scoreQuestionSplit(split)
      
      if (score > bestScore) {
        bestScore = score
        bestSplit = split
      }
    }
    
    bestSplit.forEach((block, index) => {
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
  
  private scoreQuestionSplit(blocks: string[]): number {
    let score = 0
    
    for (const block of blocks) {
      // Look for question indicators
      if (block.match(/\?/) || block.match(/choose|select|which|what|how|when|where|why/i)) {
        score += 10
      }
      
      // Look for options
      const optionMatches = block.match(/[A-E]\)/g) || []
      score += optionMatches.length * 2
      
      // Look for answer indicators
      if (block.match(/answer|correct|solution/i)) {
        score += 5
      }
      
      // Penalize very short or very long blocks
      const wordCount = block.split(/\s+/).length
      if (wordCount < 5 || wordCount > 500) {
        score -= 5
      }
    }
    
    return score
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
      
      // Enhanced option parsing for different formats
      const optionPatterns = [
        /^([A-E])\)\s*(.+)/,           // A) option
        /^([A-E])\.\s*(.+)/,           // A. option  
        /^([A-E])\s*[-–—]\s*(.+)/,     // A - option
        /^([A-E]):\s*(.+)/,            // A: option
        /^\(([A-E])\)\s*(.+)/,         // (A) option
        /^Option\s*([A-E]):\s*(.+)/i,  // Option A: text
        /^([A-E])\s+(.+)/              // A text (with space)
      ]
      
      let optionMatched = false
      for (const pattern of optionPatterns) {
        const optionMatch = line.match(pattern)
        if (optionMatch) {
          const letter = optionMatch[1] as keyof typeof options
          if (letter in options) {
            options[letter] = optionMatch[2].trim()
            optionMatched = true
            break
          }
        }
      }
      
      if (optionMatched) continue

      // Enhanced metadata parsing
      const metadataPatterns = [
        { pattern: /^(?:correct\s*)?(?:answer|solution|right):\s*([A-E])/i, field: 'answer' },
        { pattern: /^explanation:\s*(.+)/i, field: 'explanation' },
        { pattern: /^(?:note|comment):\s*(.+)/i, field: 'explanation' },
        { pattern: /^difficulty:\s*(A[12]|B[12]|C[12])/i, field: 'difficulty' },
        { pattern: /^level:\s*(A[12]|B[12]|C[12])/i, field: 'difficulty' },
        { pattern: /^tags:\s*(.+)/i, field: 'tags' },
        { pattern: /^(?:categories|category):\s*(.+)/i, field: 'tags' }
      ]
      
      for (const { pattern, field } of metadataPatterns) {
        const match = line.match(pattern)
        if (match) {
          switch (field) {
            case 'answer':
              correctAnswer = match[1].toUpperCase()
              break
            case 'explanation':
              explanation = match[1]
              break
            case 'difficulty':
              difficulty = match[1].toUpperCase()
              break
            case 'tags':
              tags = match[1].split(/[,;]/).map(tag => tag.trim()).filter(Boolean)
              break
          }
          break
        }
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
    
    // Enhanced answer detection patterns
    const answerPatterns = [
      /(?:correct\s*)?answer:\s*([A-E])/i,
      /(?:right\s*)?answer:\s*([A-E])/i,
      /solution:\s*([A-E])/i,
      /correct:\s*([A-E])/i,
      /answer\s*key:\s*([A-E])/i,
      /answer\s*is:\s*([A-E])/i,
      /\b([A-E])\s*is\s*correct/i,
      /\b([A-E])\s*✓/,
      /\b([A-E])\s*←/,
      /\b([A-E])\s*\(correct/i,
      /option\s*([A-E])\s*is\s*right/i
    ]
    
    // Try each pattern
    for (const pattern of answerPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1].toUpperCase()
      }
    }
    
    // Look for visual indicators in options
    for (const [letter, option] of Object.entries(options)) {
      if (option && (
        option.includes('✓') ||
        option.includes('←') ||
        option.includes('(correct') ||
        option.includes('(right') ||
        option.toLowerCase().includes('this is') ||
        option.toLowerCase().includes('definitely') ||
        option.toLowerCase().includes('obviously')
      )) {
        return letter
      }
    }
    
    // Look for emphasis patterns in the surrounding text
    for (const [letter, option] of Object.entries(options)) {
      if (option && (
        lowerText.includes(`${letter.toLowerCase()}) ${option.toLowerCase()}`) &&
        (lowerText.includes('correct') || lowerText.includes('right'))
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