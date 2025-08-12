import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

import { Download, FileText, TestTube, Settings, Info } from '@phosphor-icons/react'

import { wordParser, type ParsingResult } from '@/utils/wordParser'

export default function DocumentTester() {
  const [testResults, setTestResults] = useState<Record<string, ParsingResult>>({})
  const [testing, setTesting] = useState(false)

  const createTestDocument = (format: string, content: string): File => {

Explanation: Paris is the capital and largest city of France.
Tag

B) is
D) was

Explanation: "I am" is the correct present tense form of "to be" for 
Tags: grammar, verb to be, present tense
3. Which 
B) Earth
D) Mars

Explana


      name: 'Question-Answer Format',
      content:
Tags: geography, capitals, france

Answer: B
Q: Wh
B) Wi
D) Mar
D) was
Questio

D) Pacific
Answer: D`

Tags: grammar, verb to be, present tense

3. Which planet is closest to the Sun?
(C) Fe
B) Earth
Explanatio
D) Mars
2) In whic

d. 1946
Correct: c
Category: hist
Q3. What is the square root of 64?
(B) 7

Right answer: C
    },
    'minimal-format': {
      content: `Question: What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
E) 7
Answer: B

Q: Who wrote "Romeo and Juliet"?
A) Charles Dickens
B) William Shakespeare
C) Jane Austen
D) Mark Twain
E) Ernest Hemingway
A: B

Question: What is the largest ocean on Earth?
A) Atlantic
B) Indian
C) Arctic
D) Pacific
E) Southern
Answer: D`
    },

    'mixed-format': {
      name: 'Mixed Format',
      description: 'Various question styles mixed together',
      content: `Question 1: What is the chemical symbol for gold?
Options:
(A) Au
(B) Ag
(C) Fe
(D) Cu
(E) Pb
Answer: A
Explanation: Au comes from the Latin name "aurum" meaning gold.
Level: B1
Tags: chemistry, elements

2) In which year did World War II end?
a. 1943
b. 1944
c. 1945
d. 1946
e. 1947
Correct: c
Note: World War II ended in 1945 with the surrender of Japan.
Category: history

Q3. What is the square root of 64?
(A) 6
(B) 7
(C) 8
(D) 9
(E) 10
Right answer: C
Tags: mathematics, square roots`
    },

    'minimal-format': {
      name: 'Minimal Format',
      description: 'Basic questions without metadata',
      content: `1. What color is the sky?

    con
    cons
    a.hre
    docum

    
    
  }
  con
    r
     

  }
  retu
      <
        
      
        
      

                This te
              </AlertDescription>

              <Button 

              >

                variant
                  // Qu
A) 3
C) 5


C) Green
                  
              
                  if (result.questions.length > 0) {

                  }

                <TestTube size={16} className="mr-

                <Settin
              
          </div>
      </Card>
      <Tabs defa

          <TabsTr
          <TabsTrigger value="analysis">Analysis</TabsTrigger>

          <LiveDemo />

          <div className="grid gap-4">

                  <div className="flex items-start j

       
       
       
       
       

                 
                      </Button>
              
                        disabled={testing}
     
  }

            ))}
        <
        <TabsContent value="samples" className="space-y-4">
        </TabsContent>
        <TabsContent value="results" className="space-y-4">
      
                <FileText size={48} c
              </CardContent>
          ) : (
          
              
                return (
                    summary.status === 'error' ? 'border-l-destruct
          
       
      
                   
                     
                          summary.status === 'warning' ? 'secondary' :
                        }>
                 
     
  }

                        </div>
                    
                      
    
         
                          <div cla
                        </div>

        
      
                              <li key={idx}>{warning}</li>
                            {res
       
      

      
                          <ul cl
                              <li key={idx}>{error}</li>
      
                      )}
                      {result.questions.length > 0 && (
        
      
                     
                                  Option
                                  Difficulty: {question.difficulty} |
        
               
                       
     
   

        </TabsContent>
        <TabsContent value="analysis" className="space-y-4">
            <Card>
                <p className="text-muted-
            </Card>
            <div
                <CardHeader>
                </CardHeader>
             
                      <div class
                      </div>
    
                      <div className="text-2xl 
                      </div>
      
   

                    </div>
                      <div className="text-2xl font
            
                    </div>
                </CardContent>

                <CardHeader>
     
   

          
                      
            
                    
                              {result.statistics.totalQue
                          </div>
                            <div className="te
                      
                     
                  </d
              </Card>
          )}
      </Tabs>
  )






              <Button 

                disabled={testing}



              </Button>



              </Button>

          </div>

      </Card>









          <div className="grid gap-4">







                        {data.description}



                      </div>
                    </div>




















            ))}



        <TabsContent value="results" className="space-y-4">





















                        <div>



                        <Badge variant={







                      </div>





                        </div>



                        </div>











                        <div className="mt-3">













                        <div className="mt-3">




                            ))}

                        </div>
























            </div>

        </TabsContent>











                <CardHeader>







                      </div>

                    </div>



















                </CardContent>



                <CardHeader>

                </CardHeader>







                      







                          </div>











          )}

      </Tabs>

  )
