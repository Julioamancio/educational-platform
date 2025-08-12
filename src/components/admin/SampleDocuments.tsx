import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, TestTube } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function SampleDocuments() {
  const sampleDocs = {
    'basic-english': {
      title: 'Basic English Grammar',
      description: 'Simple grammar questions with standard formatting',
      content: `1. What is the correct form of "to be" for "I"?
A) am
B) is
C) are
D) was
E) were

Correct Answer: A
Explanation: The present tense of "to be" for first person singular "I" is "am". This is a fundamental rule in English grammar.
Difficulty: A1
Tags: grammar, present tense, verb to be

2. Choose the correct article: "I saw ___ elephant at the zoo."
A) a
B) an
C) the
D) some
E) any

Correct Answer: B
Explanation: Use "an" before words that start with vowel sounds. "Elephant" begins with a vowel sound, so "an" is correct.
Difficulty: A1
Tags: grammar, articles, vowels

3. Which sentence is grammatically correct?
A) She don't like pizza
B) She doesn't like pizza
C) She not like pizza
D) She no like pizza
E) She doesn't likes pizza

Correct Answer: B
Explanation: With third person singular (she/he/it), we use "doesn't" for negation, not "don't". The base form of the verb follows "doesn't".
Difficulty: A2
Tags: grammar, negation, third person`
    },

    'advanced-science': {
      title: 'Advanced Biology & Chemistry',
      description: 'Complex scientific questions with detailed explanations',
      content: `Question 1: In cellular respiration, what is the primary function of the electron transport chain?

[IMAGE: electron_transport_chain.png would be embedded here]

A) To produce glucose from carbon dioxide
B) To generate ATP through oxidative phosphorylation
C) To break down glucose into pyruvate
D) To transport oxygen to cells
E) To synthesize proteins

Correct Answer: B
Explanation: The electron transport chain is the final stage of cellular respiration where electrons are passed through a series of protein complexes. This process creates a proton gradient that drives ATP synthesis through oxidative phosphorylation. The chain does not produce glucose (that's photosynthesis), break down glucose (that's glycolysis), transport oxygen systemically (that's the circulatory system), or synthesize proteins (that's translation).
Difficulty: B2
Tags: biology, cellular respiration, ATP, electron transport chain, biochemistry

2. What is the molecular formula for benzene, and what type of bonding is present?

[IMAGE: benzene_structure.png would be embedded here]

A) C₆H₆ with alternating single and double bonds
B) C₆H₁₂ with all single bonds
C) C₆H₆ with delocalized π electrons
D) C₆H₁₄ with saturated carbon chain
E) C₆H₄ with triple bonds

Answer: C
Explanation: Benzene has the molecular formula C₆H₆ and features a unique aromatic structure with delocalized π electrons. Rather than having distinct single and double bonds (as option A suggests), benzene has equal bond lengths due to electron delocalization around the ring. This delocalization gives benzene its stability and unique chemical properties. Options B and D represent saturated hydrocarbons, while option E has an incorrect formula.
Difficulty: C1
Tags: chemistry, organic chemistry, benzene, aromatic compounds, molecular structure

Q3: Which process occurs during the light-dependent reactions of photosynthesis?

[IMAGE: photosynthesis_diagram.png would be embedded here]

Options:
(A) Carbon fixation in the Calvin cycle
(B) Production of glucose from CO₂
(C) Water photolysis and oxygen release
(D) NADPH consumption for sugar synthesis
(E) ATP hydrolysis for energy release

Correct: C
Note: During the light-dependent reactions (photo-reactions), chlorophyll absorbs light energy which is used to split water molecules (photolysis). This process releases oxygen as a byproduct and generates ATP and NADPH. Options A and B occur during the light-independent reactions (Calvin cycle). Option D describes NADPH usage, not production. Option E describes energy release rather than the energy capture that occurs in light reactions.
Level: B2
Categories: biology, photosynthesis, chloroplasts, energy conversion`
    },

    'mixed-formats': {
      title: 'Mixed Question Formats',
      description: 'Various formatting styles in one document',
      content: `Question #1: What is the capital of Australia?
(A) Sydney
(B) Melbourne  
(C) Canberra
(D) Perth
(E) Brisbane
Answer: C

2) In which year did the Berlin Wall fall?
a. 1987
b. 1989
c. 1991
d. 1993
e. 1995
Correct: b
Explanation: The Berlin Wall fell on November 9, 1989.
Tags: history, cold war

Q.3 What is the chemical symbol for gold?
Options:
A - Au
B - Ag
C - Fe  
D - Cu
E - Pb
Right Answer: A
Note: Au comes from the Latin "aurum" meaning gold.
Difficulty: A2

4. Which planet is largest in our solar system?
A) Earth
B) Jupiter
C) Saturn
D) Neptune  
E) Mars
Solution: B
Explanation: Jupiter is by far the largest planet, with a mass greater than all other planets combined.
Category: astronomy

Question Five: What is the square root of 144?
A: 10
B: 11
C: 12
D: 13
E: 14
Answer Key: C
Tags: mathematics, square roots`
    },

    'no-answers': {
      title: 'Questions Without Explicit Answers',
      description: 'Test auto-detection capabilities',
      content: `1. What is 2 + 2?
A) 3
B) 4  ← This is obviously correct
C) 5
D) 6
E) 7

2. Which is the largest ocean?
A) Atlantic
B) Indian
C) Arctic
D) Pacific (This one is definitely right!)
E) Southern

3. What color is grass?
A) Red
B) Blue
C) Green (correct answer)
D) Yellow
E) Purple

4. How many legs does a spider have?
A) 6
B) 8 ✓
C) 10
D) 12
E) 14

5. What is the freezing point of water?
A) 0°C ← Answer
B) 10°C
C) -10°C
D) 5°C
E) -5°C`
    },

    'minimal-format': {
      title: 'Minimal Formatting',
      description: 'Basic questions without metadata',
      content: `1. What is the largest mammal?
A) Elephant
B) Blue whale
C) Giraffe
D) Hippopotamus
E) Rhinoceros

2. Which gas do plants absorb from the atmosphere?
A) Oxygen
B) Nitrogen
C) Carbon dioxide
D) Hydrogen
E) Helium

3. What is the basic unit of matter?
A) Molecule
B) Atom
C) Cell
D) Proton
E) Electron

4. How many sides does a triangle have?
A) 2
B) 3
C) 4
D) 5
E) 6

5. What is the speed of light?
A) 300,000 km/s
B) 150,000 km/s
C) 450,000 km/s
D) 600,000 km/s
E) 100,000 km/s`
    }
  }

  const downloadSample = (key: string) => {
    const doc = sampleDocs[key as keyof typeof sampleDocs]
    const blob = new Blob([doc.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${key}-sample.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Sample document downloaded', {
      description: `${doc.title} is ready for testing`
    })
  }

  const downloadAll = () => {
    Object.keys(sampleDocs).forEach(key => {
      setTimeout(() => downloadSample(key), 100)
    })
    toast.success('All sample documents downloaded', {
      description: 'Check your downloads folder for 5 test files'
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube size={20} />
            Sample Documents for Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Download these sample documents to test the Word import functionality. 
              Each document represents different formatting styles and complexity levels.
            </p>
            
            <div className="flex gap-2">
              <Button onClick={downloadAll} className="flex-1">
                <Download size={16} className="mr-2" />
                Download All Samples
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {Object.entries(sampleDocs).map(([key, doc]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText size={16} />
                    {doc.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {doc.description}
                  </p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {doc.content.split('\n').filter(line => 
                        line.match(/^\d+\./) || line.match(/^Q\d+/) || line.match(/Question/)
                      ).length} questions
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground font-mono bg-muted p-2 rounded max-h-20 overflow-hidden">
                    {doc.content.substring(0, 150)}...
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSample(key)}
                  className="ml-4"
                >
                  <Download size={14} className="mr-1" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}