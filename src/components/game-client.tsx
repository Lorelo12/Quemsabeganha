'use client';

import { gameShowHost } from '@/ai/flows/game-show-host';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { getAudiencePoll, type AudiencePollOutput } from '@/ai/flows/audience-poll-flow';
import { getExpertsOpinion, type ExpertsOpinionOutput } from '@/ai/flows/experts-opinion-flow';

import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { useToast } from '@/hooks/use-toast';
import { PRIZE_TIERS } from '@/lib/questions';
import type { Question, LifelineState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Loader2, Crown, Layers, Users, GraduationCap, SkipForward, CircleDollarSign, Gem, BarChart2, Lightbulb, Info, Trophy, MessageSquarePlus, AlertTriangle, Sparkles, Gamepad2, ScrollText, Award } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Logo } from './logo';
import { Card, CardContent } from './ui/card';

type GameState = 'menu' | 'playing' | 'game_over';
type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';
type InfoDialog = 'ajuda' | 'creditos';

const TOTAL_QUESTIONS = 16;
const PLAYER_NAME = "Jogador(a)";

const answerButtonColors: { [key: string]: { gradient: string, border: string } } = {
  A: { gradient: 'from-purple-500 to-indigo-600', border: 'border-purple-400' },
  B: { gradient: 'from-blue-500 to-cyan-500', border: 'border-blue-400' },
  C: { gradient: 'from-yellow-500 to-orange-500', border: 'border-yellow-400' },
  D: { gradient: 'from-pink-500 to-red-600', border: 'border-pink-400' },
};


export default function GameClient() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
  const [hostResponse, setHostResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const [lifelines, setLifelines] = useState<LifelineState>({
    skip: 1, // "Pular"
    cards: true, // "Cartas"
    audience: true, // "Plateia"
    experts: true, // "Universitários"
  });
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  const [dialogContent, setDialogContent] = useState<'audience' | 'experts' | null>(null);
  const [infoDialog, setInfoDialog] = useState<InfoDialog | null>(null);
  const [audienceData, setAudienceData] = useState<AudiencePollOutput | null>(null);
  const [expertsData, setExpertsData] = useState<ExpertsOpinionOutput | null>(null);
  const [prizeWon, setPrizeWon] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  
  const [isAiConfigured, setIsAiConfigured] = useState(true);

  const currentQuestion = quizQuestions[currentQuestionIndex] ?? null;
  
  useEffect(() => {
    const keyIsPresent = !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    setIsAiConfigured(keyIsPresent);
  }, []);

  const resetLifelines = () => {
    setLifelines({ skip: 1, cards: true, audience: true, experts: true });
    setDisabledOptions([]);
  }

  const startGame = useCallback(async () => {
    if (!isAiConfigured || isProcessing) return;
    setGameState('playing');
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    resetLifelines();
    setAnswerStatus('unanswered');
    setSelectedAnswer(null);
    setHostResponse('');
    setIsProcessing(true);
    setDisabledOptions([]);
    setGaveUp(false);
    setPrizeWon(0);
    try {
        const newQuestions = await generateQuiz();
        if (newQuestions.length !== TOTAL_QUESTIONS) {
            throw new Error("Failed to generate the correct number of questions.");
        }
        setQuizQuestions(newQuestions);
    } catch (error) {
        toast({
            title: "Erro na Geração do Quiz",
            description: "Não foi possível criar as perguntas. Verifique sua chave de API do Google e tente recomeçar.",
            variant: "destructive",
        });
        setGameState('menu'); // Return to main menu on failure
    } finally {
        setIsProcessing(false);
    }
  }, [toast, isAiConfigured, isProcessing]);

  useEffect(() => {
    if (gameState !== 'game_over') return;

    let finalPrize = 0;
    const isWinner = !gaveUp && answerStatus === 'correct' && currentQuestionIndex === TOTAL_QUESTIONS - 1;

    if (isWinner) {
      finalPrize = PRIZE_TIERS[TOTAL_QUESTIONS - 1].amount;
    } else if (gaveUp) {
      finalPrize = currentQuestionIndex > 0 ? PRIZE_TIERS[currentQuestionIndex - 1].amount : 0;
    } else if (answerStatus === 'incorrect') {
      const lastCheckpointIndex = PRIZE_TIERS.slice(0, currentQuestionIndex)
        .map(p => p.isCheckpoint)
        .lastIndexOf(true);
      finalPrize = lastCheckpointIndex !== -1 ? PRIZE_TIERS[lastCheckpointIndex].amount : 0;
    }
    
    setPrizeWon(finalPrize);
  }, [gameState, answerStatus, currentQuestionIndex, gaveUp]);


  useEffect(() => {
    if (!hostResponse || answerStatus === 'unanswered') return;

    const timer = setTimeout(() => {
        if (answerStatus === 'correct') {
            if (currentQuestionIndex === TOTAL_QUESTIONS - 1) {
                setGameState('game_over');
                setIsProcessing(false);
            } else {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setAnswerStatus('unanswered');
                setHostResponse('');
                setDisabledOptions([]);
                setIsProcessing(false);
            }
        } else if (answerStatus === 'incorrect') {
            setGameState('game_over');
            setIsProcessing(false);
        }
    }, 3000); // Increased delay for dramatic effect

    return () => clearTimeout(timer);
  }, [hostResponse, answerStatus, currentQuestionIndex]);


  const handleAnswer = async (answerKey: string) => {
    if (!currentQuestion || isProcessing || selectedAnswer) return;
    setIsProcessing(true);
    setSelectedAnswer(answerKey);

    const isCorrect = answerKey === currentQuestion.correctAnswerKey;
    setAnswerStatus(isCorrect ? 'correct' : 'incorrect');

    const nextPrize = PRIZE_TIERS[currentQuestionIndex].amount;
    
    const lastCheckpointIndex = PRIZE_TIERS.slice(0, currentQuestionIndex)
        .map(p => p.isCheckpoint)
        .lastIndexOf(true);
    const prizeOnFailure = lastCheckpointIndex !== -1 ? PRIZE_TIERS[lastCheckpointIndex].amount : 0;

    try {
      const res = await gameShowHost({ playerName: PLAYER_NAME, question: currentQuestion.question, answer: answerKey, isCorrect: isCorrect, currentPrize: nextPrize, prizeOnFailure: prizeOnFailure });
      setHostResponse(res.response);
    } catch (error) {
      setHostResponse(isCorrect ? 'Resposta certa!' : 'Resposta errada.');
      setIsProcessing(false); // Ensure processing is false on error
    }
  };

  const restartGame = () => {
    setGameState('menu');
  };
  
  const handleUseSkip = () => {
    if (lifelines.skip > 0 && answerStatus === 'unanswered' && currentQuestionIndex < TOTAL_QUESTIONS - 1) {
      setLifelines(prev => ({ ...prev, skip: prev.skip - 1 }));
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswerStatus('unanswered');
      setHostResponse('');
      setDisabledOptions([]);
    }
  };

  const handleUseCards = () => {
    if (lifelines.cards && currentQuestion && answerStatus === 'unanswered') {
      setLifelines(prev => ({ ...prev, cards: false }));
      const incorrectOptions = Object.keys(currentQuestion.options).filter(
        key => key !== currentQuestion.correctAnswerKey
      );
      const shuffled = incorrectOptions.sort(() => 0.5 - Math.random());
      setDisabledOptions(shuffled.slice(0, 2));
    }
  };
  
  const handleUseAudience = async () => {
    if (lifelines.audience && currentQuestion && answerStatus === 'unanswered') {
      setIsProcessing(true);
      setLifelines(prev => ({ ...prev, audience: false }));
      try {
        const result = await getAudiencePoll(currentQuestion);
        setAudienceData(result);
        setDialogContent('audience');
      } catch (error) {
         toast({ title: "Erro ao consultar a plateia.", variant: "destructive" });
         setLifelines(prev => ({...prev, audience: true}));
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  const handleUseExperts = async () => {
    if (lifelines.experts && currentQuestion && answerStatus === 'unanswered') {
      setIsProcessing(true);
      setLifelines(prev => ({ ...prev, experts: false }));
      try {
        const result = await getExpertsOpinion(currentQuestion);
        setExpertsData(result);
        setDialogContent('experts');
      } catch (error) {
         toast({ title: "Erro ao consultar os convidados.", variant: "destructive" });
         setLifelines(prev => ({...prev, experts: true}));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleGiveUp = () => {
    if (isProcessing || !!selectedAnswer) return;
    setGaveUp(true);
    setGameState('game_over');
  };
  
  const renderGameScreen = () => {
     if (isProcessing && quizQuestions.length === 0) {
        return (
           <div className="flex flex-col items-center justify-center gap-4 text-primary h-96">
             <Loader2 className="h-16 w-16 animate-spin" />
             <p className="text-2xl font-bold font-display text-glow-primary">Gerando seu quiz exclusivo...</p>
           </div>
        );
      }
      
      if (!currentQuestion) return null;

      return (
        <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
          {/* Prize Ladder */}
          <div className="w-full text-center p-2 rounded-lg bg-black/30 border border-secondary/50">
            <p className="font-display text-xl tracking-wider">
              <span className="text-white/70">Pergunta {currentQuestionIndex + 1}/{TOTAL_QUESTIONS} valendo </span> 
              <span className="font-bold text-primary text-glow-primary">R$ {PRIZE_TIERS[currentQuestionIndex].amount.toLocaleString('pt-BR')}</span>
            </p>
          </div>

          <div className="w-full flex flex-col md:flex-row items-start gap-4">
            {/* Main Question and Answers */}
            <div className="flex-grow w-full flex flex-col gap-4">
                <Card className="text-center bg-card/80 border-2 border-accent/50 rounded-xl p-4 md:p-6 min-h-[120px] flex items-center justify-center">
                    <p className="text-xl md:text-3xl font-bold text-white font-sans">{currentQuestion.question}</p>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {Object.entries(currentQuestion.options).map(([key, value]) => {
                    const isSelected = selectedAnswer === key;
                    const isCorrect = currentQuestion.correctAnswerKey === key;
                    const isDisabled = disabledOptions.includes(key);
                    const buttonStyle = answerButtonColors[key as keyof typeof answerButtonColors];

                    return (
                      <button
                        key={key}
                        onClick={() => handleAnswer(key)}
                        disabled={selectedAnswer !== null || isProcessing || isDisabled}
                        className={cn(
                          "flex items-center gap-4 p-3 md:p-4 rounded-lg border-2 text-base md:text-lg font-bold transition-all duration-300 transform hover:scale-[1.03] hover:brightness-125",
                          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:brightness-100",
                          isDisabled && "opacity-30 bg-gray-700 !border-gray-600",
                          !selectedAnswer && `bg-gradient-to-br ${buttonStyle.gradient} ${buttonStyle.border}`,
                          isSelected && isCorrect && "bg-green-500 border-green-300 animate-pulse ring-4 ring-white",
                          isSelected && !isCorrect && "bg-red-500 border-red-300 animate-pulse ring-4 ring-white",
                          selectedAnswer && !isSelected && !isCorrect && "opacity-40"
                        )}
                      >
                        <span className={cn("flex items-center justify-center h-8 w-8 rounded-full font-black text-white text-glow-primary", `bg-gradient-to-br ${buttonStyle.gradient}`)}>{key}</span>
                        <span className="text-white text-left flex-1">{value}</span>
                      </button>
                    );
                  })}
                </div>
            </div>
            {/* Lifelines */}
            <Card className="w-full md:w-auto bg-card/80 border-2 border-secondary/50 rounded-xl p-2">
              <div className="flex md:flex-col justify-around items-center gap-2 text-center">
                 <button onClick={handleUseExperts} disabled={!lifelines.experts || !!selectedAnswer || isProcessing} className="flex flex-col items-center gap-1 text-secondary disabled:opacity-40 p-2 rounded-md hover:bg-secondary/20 transition-colors">
                    <GraduationCap className="w-8 h-8"/>
                    <span className="font-semibold text-xs">Universitários</span>
                 </button>
                 <button onClick={handleUseCards} disabled={!lifelines.cards || !!selectedAnswer || isProcessing} className="flex flex-col items-center gap-1 text-accent disabled:opacity-40 p-2 rounded-md hover:bg-accent/20 transition-colors">
                    <Layers className="w-8 h-8"/>
                    <span className="font-semibold text-xs">Cartas</span>
                 </button>
                 <button onClick={handleUseAudience} disabled={!lifelines.audience || !!selectedAnswer || isProcessing} className="flex flex-col items-center gap-1 text-orange-400 disabled:opacity-40 p-2 rounded-md hover:bg-orange-400/20 transition-colors">
                    <Users className="w-8 h-8"/>
                    <span className="font-semibold text-xs">Plateia</span>
                 </button>
                  <button onClick={handleUseSkip} disabled={lifelines.skip === 0 || !!selectedAnswer || isProcessing} className="flex flex-col items-center gap-1 text-green-400 disabled:opacity-40 p-2 rounded-md hover:bg-green-400/20 transition-colors">
                    <SkipForward className="w-8 h-8"/>
                    <span className="font-semibold text-xs">Pular ({lifelines.skip})</span>
                 </button>
              </div>
            </Card>
           </div>
           
           <Progress value={((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100} className="w-full h-2 bg-black/30 border border-border" indicatorClassName="bg-gradient-to-r from-secondary via-primary to-accent" />
            
            {hostResponse && (
              <Card className="w-full text-center mt-4 animate-fade-in p-4 bg-black/50 border-primary">
                  <p className="text-xl font-bold text-glow-primary font-display">{hostResponse}</p>
              </Card>
            )}

            <div className="w-full text-center mt-4">
                <Button 
                    variant="destructive"
                    onClick={handleGiveUp} 
                    disabled={isProcessing || !!selectedAnswer}
                    className="bg-red-700/80 hover:bg-red-700 border-red-500 font-bold text-lg py-6 px-8 rounded-full shadow-lg"
                >
                    <Trophy className="mr-2 h-5 w-5"/>
                    Parar e Pegar o Prêmio
                </Button>
            </div>
        </div>
      );
  }
  
  const renderContent = () => {
    switch(gameState) {
      case 'menu':
        return (
          <div className="flex flex-col items-center justify-center text-center w-full max-w-lg p-4 gap-8 animate-fade-in">
            <Logo />
            {!isAiConfigured && (
                <Alert variant="destructive" className="mb-6 text-left">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Configuração da IA Incompleta</AlertTitle>
                    <AlertDescription>
                        A chave da API do Google está faltando. Para o jogo funcionar, você precisa obter uma chave no{' '}
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-destructive-foreground">
                            Google AI Studio
                        </a>
                        {' '}e colá-la no arquivo <strong>.env</strong> na variável <code>NEXT_PUBLIC_GOOGLE_API_KEY</code>.
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <Button onClick={startGame} size="lg" className="w-full font-bold text-xl h-16 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-transform box-glow-primary rounded-lg" disabled={isProcessing || !isAiConfigured}>
                {isProcessing ? <Loader2 className="animate-spin" /> : "JOGAR AGORA"}
              </Button>
              <Button onClick={() => setInfoDialog('ajuda')} size="lg" variant="outline" className="w-full font-bold text-lg h-14 border-secondary text-secondary hover:bg-secondary/20 hover:text-secondary rounded-lg">
                VER REGRAS
              </Button>
              <Button onClick={() => setInfoDialog('creditos')} size="lg" variant="outline" className="w-full font-bold text-lg h-14 border-accent text-accent hover:bg-accent/20 hover:text-accent rounded-lg">
                CRÉDITOS
              </Button>
            </div>
          </div>
        );
      case 'game_over':
        const isWinner = !gaveUp && answerStatus === 'correct' && currentQuestionIndex === TOTAL_QUESTIONS - 1;
        const finalMessage = isWinner 
          ? `Parabéns! Você ganhou R$ ${prizeWon.toLocaleString('pt-BR')}!`
          : gaveUp 
          ? `Decisão inteligente! Você leva para casa R$ ${prizeWon.toLocaleString('pt-BR')}.`
          : `Você errou... mas não saiu de mãos abanando! Você ganhou R$ ${prizeWon.toLocaleString('pt-BR')}.`;

        return (
          <div className={cn(
            "flex flex-col items-center justify-center text-center w-full max-w-2xl animate-fade-in transition-colors duration-1000 p-8 rounded-2xl",
            isWinner ? "bg-primary/20 border-2 border-primary box-glow-primary" : "bg-red-950/20 border-2 border-red-500"
          )}>
            {isWinner 
              ? <Award className="h-24 w-24 text-primary animate-pulse-slow" style={{ filter: 'drop-shadow(0 0 15px hsl(var(--primary)))' }}/>
              : <Crown className="h-24 w-24 text-white/50" />
            }
            <h1 className="font-display text-4xl md:text-6xl font-black mt-4 text-glow-primary">{isWinner ? "VOCÊ GANHOU!" : "FIM DE JOGO"}</h1>
            <p className="text-xl mt-4 text-white/80 max-w-xl my-8">
              {finalMessage}
            </p>
             <div className="flex gap-4 mt-4">
                <Button onClick={restartGame} size="lg" className="text-lg font-bold px-8 py-6 rounded-lg">
                  TENTAR NOVAMENTE
                </Button>
                <Button onClick={restartGame} variant="outline" size="lg" className="text-lg font-bold px-8 py-6 rounded-lg">
                  TELA INICIAL
                </Button>
             </div>
          </div>
        );
      case 'playing':
        return (
            <div className="flex flex-col items-center gap-4 w-full">
                {renderGameScreen()}
            </div>
        );
    }
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto">
        {renderContent()}
      </div>
      <AlertDialog open={dialogContent !== null} onOpenChange={() => setDialogContent(null)}>
        <AlertDialogContent className="bg-card border-primary">
          {dialogContent === 'audience' && audienceData && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-glow-primary"><Users/>Opinião da Plateia</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 pt-4">
                    {Object.entries(audienceData).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="font-bold w-4">{key}</span>
                        <div className="w-full bg-muted rounded-full h-6">
                           <div className="bg-primary h-6 rounded-full text-right pr-2 text-primary-foreground flex items-center justify-end" style={{ width: `${value}%` }}>
                            {value}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Entendi!</AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
          {dialogContent === 'experts' && expertsData && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-glow-secondary"><GraduationCap/>Opinião dos Universitários</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4 pt-4">
                    {expertsData.opinions.map((expert, index) => (
                      <div key={index} className="p-2 bg-muted/50 rounded-md text-foreground">
                        <p><span className="font-bold text-secondary">{expert.name}:</span> "{expert.opinion}"</p>
                      </div>
                    ))}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Obrigado!</AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={infoDialog !== null} onOpenChange={(isOpen) => !isOpen && setInfoDialog(null)}>
        <DialogContent className="bg-card border-primary text-left max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display text-glow-primary flex items-center gap-2">
              {infoDialog === 'ajuda' && <><ScrollText /> Regras do Jogo</>}
              {infoDialog === 'creditos' && <><Sparkles /> Créditos</>}
            </DialogTitle>
          </DialogHeader>
            <DialogDescription asChild>
              <div className="text-white/90 font-sans max-h-[60vh] overflow-y-auto pr-2">
                {infoDialog === 'ajuda' && (
                  <div className="space-y-4 pt-4">
                      <p>O objetivo é simples: responda a 16 perguntas de conhecimentos gerais para ganhar o prêmio máximo de R$ 1.000.000!</p>
                      
                      <div>
                          <h3 className="font-bold text-primary mb-2">Ajudas Disponíveis (1 uso por jogo, exceto Pular):</h3>
                          <ul className="space-y-1 list-disc list-inside">
                              <li><strong className="text-green-400">Pular:</strong> Você tem 1 chance de pular uma pergunta que não sabe.</li>
                              <li><strong className="text-secondary">Universitários:</strong> Pede a opinião de três especialistas fictícios.</li>
                              <li><strong className="text-accent">Cartas:</strong> Remove duas respostas incorretas da tela.</li>
                              <li><strong className="text-orange-400">Plateia:</strong> Mostra a porcentagem de votos da plateia para cada opção.</li>
                          </ul>
                      </div>
                  
                      <div>
                          <h3 className="font-bold text-primary mb-2">Regras de Premiação:</h3>
                          <ul className="space-y-1 list-disc list-inside">
                              <li>A cada resposta correta, você avança para o próximo nível de prêmio.</li>
                              <li>Se preferir não arriscar, você pode <strong className="text-red-500">parar e levar</strong> o valor da última pergunta que acertou.</li>
                              <li>Existem dois <strong className="text-primary">checkpoints seguros</strong>: na pergunta 5 (R$ 5.000) e na pergunta 10 (R$ 50.000).</li>
                              <li>Se errar, você leva para casa o valor do último checkpoint que alcançou. Se errar antes do primeiro checkpoint, o prêmio é R$ 0.</li>
                          </ul>
                      </div>
                      <p className="text-center font-bold pt-4 text-primary text-glow-primary">Boa sorte!</p>
                  </div>
                )}
                {infoDialog === 'creditos' && (
                  <div className="space-y-4 pt-4">
                      <p>Este jogo é uma homenagem aos clássicos programas de auditório e foi desenvolvido como uma demonstração das capacidades da IA generativa.</p>
                      
                      <div className="text-center py-2">
                          <p>Desenvolvido com 💡 por</p>
                          <p className="font-bold font-display text-lg text-primary text-glow-primary">Firebase Studio</p>
                      </div>
                  
                      <div>
                          <h3 className="font-bold text-secondary mb-2">Tecnologias Utilizadas:</h3>
                          <ul className="space-y-1 list-disc list-inside">
                              <li>Next.js & React</li>
                              <li>Tailwind CSS & ShadCN UI</li>
                              <li>Genkit & Google Gemini</li>
                          </ul>
                      </div>
                  </div>
                )}
              </div>
            </DialogDescription>
            <DialogFooter className="!mt-4 sm:!justify-end">
              <DialogClose asChild><Button>Fechar</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
