'use client';

import { gameShowHost } from '@/ai/flows/game-show-host';
import { generateQuestion } from '@/ai/flows/generate-question-flow';
import { getAudiencePoll, type AudiencePollOutput } from '@/ai/flows/audience-poll-flow';
import { getExpertsOpinion, type ExpertsOpinionOutput } from '@/ai/flows/experts-opinion-flow';

import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

import { useToast } from '@/hooks/use-toast';
import { PRIZE_TIERS } from '@/lib/questions';
import type { Question, LifelineState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Loader2, Crown, Layers, Users, GraduationCap, SkipForward, CircleDollarSign, Gem, BarChart2, Lightbulb, Info } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Logo } from './logo';
import { Card } from './ui/card';
import { PrizeTable } from './prize-table';

type GameState = 'name_input' | 'playing' | 'game_over';
type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';

const TOTAL_QUESTIONS = 16;

const answerButtonColors: { [key: string]: { gradient: string } } = {
  A: { gradient: 'from-purple-500 to-indigo-600' },
  B: { gradient: 'from-blue-400 to-cyan-500' },
  C: { gradient: 'from-yellow-400 to-orange-500' },
  D: { gradient: 'from-pink-500 to-red-600' },
};


export default function GameClient() {
  const [gameState, setGameState] = useState<GameState>('name_input');
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('unanswered');
  const [hostResponse, setHostResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const [lifelines, setLifelines] = useState<LifelineState>({
    skip: 3,
    cards: true,
    audience: true,
    experts: true,
  });
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  const [dialogContent, setDialogContent] = useState<'audience' | 'experts' | null>(null);
  const [audienceData, setAudienceData] = useState<AudiencePollOutput | null>(null);
  const [expertsData, setExpertsData] = useState<ExpertsOpinionOutput | null>(null);

  const resetLifelines = () => {
    setLifelines({ skip: 3, cards: true, audience: true, experts: true });
    setDisabledOptions([]);
  }

  const fetchQuestion = useCallback(async (index: number) => {
    setIsProcessing(true);
    setCurrentQuestion(null);
    setDisabledOptions([]);
    try {
      const newQuestion = await generateQuestion({
        difficulty: index + 1,
        previousQuestions: askedQuestions,
      });
      setAskedQuestions(prev => [...prev, newQuestion.question]);
      setCurrentQuestion(newQuestion);
      setCurrentQuestionIndex(index);
      setSelectedAnswer(null);
      setAnswerStatus('unanswered');
      setHostResponse('');
    } catch (error) {
      console.error("Failed to fetch question:", error);
      toast({
        title: "Erro na Geração da Pergunta",
        description: "Não foi possível conectar com nossa produção. Tente recomeçar o jogo.",
        variant: "destructive",
      });
      setGameState('game_over');
    } finally {
      setIsProcessing(false);
    }
  }, [askedQuestions, toast]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setAskedQuestions([]);
    setCurrentQuestionIndex(0);
    resetLifelines();
    fetchQuestion(0);
  }, [fetchQuestion]);

  useEffect(() => {
    if (!hostResponse || answerStatus === 'unanswered') return;

    const timer = setTimeout(() => {
        if (answerStatus === 'correct') {
            if (currentQuestionIndex === TOTAL_QUESTIONS - 1) {
                setGameState('game_over');
            } else {
                fetchQuestion(currentQuestionIndex + 1);
            }
        } else if (answerStatus === 'incorrect') {
            setGameState('game_over');
            setIsProcessing(false);
        }
    }, 2500);

    return () => clearTimeout(timer);
  }, [hostResponse, answerStatus, currentQuestionIndex, fetchQuestion]);


  const handleAnswer = async (answerKey: string) => {
    if (!currentQuestion) return;
    setIsProcessing(true);
    setSelectedAnswer(answerKey);

    const isCorrect = answerKey === currentQuestion.correctAnswerKey;
    setAnswerStatus(isCorrect ? 'correct' : 'incorrect');

    const nextPrize = PRIZE_TIERS[currentQuestionIndex].amount;
    
    // If the player is wrong, they win the prize of the last question they answered correctly.
    const prizeOnFailure = currentQuestionIndex > 0 ? PRIZE_TIERS[currentQuestionIndex - 1].amount : 0;

    try {
      const res = await gameShowHost({ playerName: "Jogador(a)", question: currentQuestion.question, answer: answerKey, isCorrect: isCorrect, currentPrize: nextPrize, prizeOnFailure: prizeOnFailure });
      setHostResponse(res.response);
    } catch (error) {
      console.error(error);
      setHostResponse(isCorrect ? 'Resposta certa!' : 'Resposta errada.');
    }
  };

  const restartGame = () => {
    setGameState('name_input');
    setAskedQuestions([]);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswerStatus('unanswered');
    setHostResponse('');
  };
  
  const handleUseSkip = () => {
    if (lifelines.skip > 0 && answerStatus === 'unanswered') {
      setLifelines(prev => ({ ...prev, skip: prev.skip - 1 }));
      fetchQuestion(currentQuestionIndex + 1);
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
  
  const renderGameScreen = () => {
     if (isProcessing && !currentQuestion && !hostResponse) {
        return (
           <div className="flex flex-col items-center justify-center gap-4 text-secondary h-96">
             <Loader2 className="h-16 w-16 animate-spin" />
             <p className="text-2xl font-bold text-shadow-neon-yellow">Preparando a próxima pergunta...</p>
           </div>
        );
      }
      
      if (!currentQuestion) return null;

      return (
        <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
           <div className="grid grid-cols-12 gap-4 w-full">
            <div className="col-span-10 flex flex-col gap-6">
                <Card className="text-center bg-black/30 border-2 border-accent/50 rounded-xl p-6">
                    <p className="text-2xl md:text-3xl font-bold text-white">{currentQuestion.question}</p>
                </Card>

                <div className="grid grid-cols-2 gap-4 relative">
                 <div className="absolute inset-0 flex items-center justify-center">
                    <CircleDollarSign className="w-20 h-20 text-primary/50" />
                 </div>
                  {Object.entries(currentQuestion.options).map(([key, value]) => {
                    const isSelected = selectedAnswer === key;
                    const isCorrect = currentQuestion.correctAnswerKey === key;
                    const isDisabled = disabledOptions.includes(key);
                    
                    const buttonColor = answerButtonColors[key as keyof typeof answerButtonColors];

                    return (
                      <button
                        key={key}
                        onClick={() => handleAnswer(key)}
                        disabled={selectedAnswer !== null || isProcessing || isDisabled}
                        className={cn(
                          "z-10 flex items-center gap-4 p-4 rounded-full border-2 text-lg font-bold transition-all duration-300 transform hover:scale-105",
                          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                          isDisabled && "opacity-30 bg-gray-700 !border-gray-600",
                          !selectedAnswer && `bg-gradient-to-r ${buttonColor.gradient}`,
                          isSelected && isCorrect && "bg-green-500 border-green-300 animate-pulse ring-4 ring-white",
                          isSelected && !isCorrect && "bg-red-500 border-red-300 animate-pulse ring-4 ring-white",
                          selectedAnswer && !isSelected && !isCorrect && "opacity-40"
                        )}
                      >
                        <span className={cn("flex items-center justify-center h-8 w-8 rounded-full font-black text-white", `bg-gradient-to-r ${buttonColor.gradient}`)}>{key}</span>
                        <span className="text-white">{value}</span>
                      </button>
                    );
                  })}
                </div>
            </div>
            <div className="col-span-2 flex flex-col justify-around items-center gap-4 text-center">
                 <button onClick={handleUseSkip} disabled={lifelines.skip === 0 || !!selectedAnswer || isProcessing} className="flex flex-col items-center gap-1 text-secondary disabled:opacity-40">
                    <SkipForward className="w-10 h-10"/>
                    <span className="font-semibold">Pular ({lifelines.skip})</span>
                 </button>
                 <button onClick={handleUseExperts} disabled={!lifelines.experts || !!selectedAnswer || isProcessing} className="flex flex-col items-center gap-1 text-primary disabled:opacity-40">
                    <GraduationCap className="w-10 h-10"/>
                    <span className="font-semibold">Convidado</span>
                 </button>
                 <button onClick={handleUseCards} disabled={!lifelines.cards || !!selectedAnswer || isProcessing} className="flex flex-col items-center gap-1 text-cyan-400 disabled:opacity-40">
                    <Layers className="w-10 h-10"/>
                    <span className="font-semibold">Cartas</span>
                 </button>
                 <button onClick={handleUseAudience} disabled={!lifelines.audience || !!selectedAnswer || isProcessing} className="flex flex-col items-center gap-1 text-orange-400 disabled:opacity-40">
                    <Users className="w-10 h-10"/>
                    <span className="font-semibold">Platéia</span>
                 </button>
            </div>
           </div>
           
           <Progress value={((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100} className="w-full h-4 bg-black/30 border border-border" indicatorClassName="bg-gradient-to-r from-secondary via-primary to-accent" />
            
           {hostResponse && (
              <div className="w-full text-center mt-4 animate-fade-in">
                  <p className="text-2xl font-bold text-shadow-neon-yellow">{hostResponse}</p>
              </div>
            )}
        </div>
      );
  }

  const renderContent = () => {
    switch(gameState) {
      case 'name_input':
        return (
           <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl p-4 gap-8 animate-fade-in">
            <Logo />
            <p className="text-2xl text-white/80">
              O clássico Show do Milhão brasileiro com elegância!<br/>Responda 16 perguntas e ganhe R$ 1.000.000!
            </p>
            
            <PrizeTable />

            <Button onClick={startGame} size="lg" className="text-2xl font-bold px-12 py-8 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/50 border-2 border-white/30 animate-pulse-slow">
              <Gem className="mr-4 h-8 w-8 text-accent"/>
              COMEÇAR O JOGO
            </Button>

            <div className="flex gap-4 mt-4">
                <Button variant="ghost" className="text-secondary/80 hover:text-secondary" disabled>
                    <BarChart2 className="mr-2"/> Ranking
                </Button>
                <Button variant="ghost" className="text-secondary/80 hover:text-secondary" disabled>
                    <Lightbulb className="mr-2"/> Ajuda
                </Button>
                <Button variant="ghost" className="text-secondary/80 hover:text-secondary" disabled>
                    <Info className="mr-2"/> Créditos
                </Button>
            </div>
          </div>
        );
      case 'game_over':
        const isWinner = answerStatus === 'correct' && currentQuestionIndex === TOTAL_QUESTIONS - 1;
        let prizeWon = 0;
        
        if (isWinner) {
          prizeWon = PRIZE_TIERS[TOTAL_QUESTIONS - 1].amount;
        } else {
          // Player lost. They win the prize of the last question they answered correctly.
          const lastCorrectIndex = currentQuestionIndex - 1;
          prizeWon = lastCorrectIndex >= 0 ? PRIZE_TIERS[lastCorrectIndex].amount : 0;
        }
        
        return (
          <div className="flex flex-col items-center justify-center text-center w-full max-w-2xl animate-fade-in">
            <Crown className="h-24 w-24 text-secondary animate-pulse-slow" style={{ filter: 'drop-shadow(0 0 15px hsl(var(--secondary)))' }}/>
            <h1 className="text-4xl md:text-6xl font-black mt-4 text-shadow-neon-yellow">Fim de Jogo!</h1>
            <p className="text-2xl mt-4 text-white/80">
              {isWinner ? `Parabéns!` : `Que pena!`}
            </p>
            <p className="max-w-xl text-lg text-white/80 my-8">
              {isWinner 
                ? `Você é a nova milionária do nosso quiz! Você ganhou o prêmio máximo de R$ ${prizeWon.toLocaleString('pt-BR')},00! 👑`
                : `Você leva para casa o prêmio de R$ ${prizeWon.toLocaleString('pt-BR')},00.`
              }
            </p>
             <Button onClick={restartGame} size="lg" className="animate-pulse-slow text-xl font-bold px-12 py-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/50 border-2 border-white/30">
              Jogar Novamente 💖
            </Button>
          </div>
        );
      case 'playing':
        return (
            <div className="flex flex-col items-center gap-4 w-full">
                <Logo />
                {renderGameScreen()}
            </div>
        );
    }
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 rounded-3xl bg-black/30">
        <div className="p-1 bg-gradient-to-br from-secondary via-primary to-accent rounded-2xl">
            <div className="bg-dark-bg p-6 rounded-xl min-h-[600px] flex items-center justify-center">
                {renderContent()}
            </div>
        </div>
      </div>
      <AlertDialog open={dialogContent !== null} onOpenChange={() => setDialogContent(null)}>
        <AlertDialogContent className="bg-dark-bg border-primary shadow-lg shadow-primary/30">
          {dialogContent === 'audience' && audienceData && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2"><Users/>A opinião da plateia é...</AlertDialogTitle>
                <AlertDialogDescription>
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
                <AlertDialogAction onClick={() => setDialogContent(null)}>Entendi!</AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
          {dialogContent === 'experts' && expertsData && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2"><GraduationCap/>A opinião dos convidados é...</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4 pt-4">
                    {expertsData.opinions.map((expert, index) => (
                      <div key={index} className="p-2 bg-muted/50 rounded-md text-foreground">
                        <p><span className="font-bold">{expert.name}:</span> "{expert.opinion}"</p>
                      </div>
                    ))}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setDialogContent(null)}>Obrigada!</AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
