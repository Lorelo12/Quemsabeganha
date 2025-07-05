'use client';

import { gameShowHost } from '@/ai/flows/game-show-host';
import { generateQuestion } from '@/ai/flows/generate-question-flow';
import { getAudiencePoll, type AudiencePollOutput } from '@/ai/flows/audience-poll-flow';
import { getExpertsOpinion, type ExpertsOpinionOutput } from '@/ai/flows/experts-opinion-flow';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

import { useToast } from '@/hooks/use-toast';
import { PRIZE_TIERS } from '@/lib/questions';
import type { Question, LifelineState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Crown, Layers, Users, GraduationCap, SkipForward, CircleDollarSign } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Logo } from './logo';
import { Card, CardContent } from './ui/card';

type GameState = 'name_input' | 'playing' | 'game_over';
type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';

const TOTAL_QUESTIONS = 16;
const nameSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.').max(50, 'O nome é muito longo.'),
});

const answerButtonColors: { [key: string]: { gradient: string, border: string, text: string } } = {
  A: { gradient: 'from-purple-500 to-indigo-600', border: 'border-purple-400', text: 'text-purple-200' },
  B: { gradient: 'from-blue-400 to-cyan-500', border: 'border-blue-300', text: 'text-blue-100' },
  C: { gradient: 'from-yellow-400 to-orange-500', border: 'border-yellow-300', text: 'text-yellow-100' },
  D: { gradient: 'from-pink-500 to-red-600', border: 'border-pink-400', text: 'text-pink-100' },
};


export default function GameClient() {
  const [gameState, setGameState] = useState<GameState>('name_input');
  const [playerName, setPlayerName] = useState('');
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

  const form = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: '' },
  });

  const resetLifelines = () => {
    setLifelines({ skip: 3, cards: true, audience: true, experts: true });
    setDisabledOptions([]);
  }

  const startGame = (name: string) => {
    setPlayerName(name);
    setGameState('playing');
    resetLifelines();
    fetchQuestion(0);
  };

  const fetchQuestion = async (index: number) => {
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
  };

  const handleAnswer = async (answerKey: string) => {
    if (!currentQuestion) return;
    setIsProcessing(true);
    setSelectedAnswer(answerKey);

    const isCorrect = answerKey === currentQuestion.correctAnswerKey;
    setAnswerStatus(isCorrect ? 'correct' : 'incorrect');

    const nextPrize = PRIZE_TIERS[currentQuestionIndex].amount;
    const checkpointTier = [...PRIZE_TIERS].slice(0, currentQuestionIndex).reverse().find(p => p.isCheckpoint);
    const checkpointPrize = checkpointTier ? checkpointTier.amount : 0;

    try {
      const res = await gameShowHost({ playerName, question: currentQuestion.question, answer: answerKey, isCorrect: isCorrect, currentPrize: nextPrize, checkpoint: checkpointPrize });
      setHostResponse(res.response);
    } catch (error) {
      console.error(error);
      setHostResponse(isCorrect ? 'Resposta certa!' : 'Resposta errada.');
    }
  };
  
  const handleNextWithDelay = () => {
    setTimeout(() => {
        setIsProcessing(false);
        if (answerStatus === 'correct') {
            if (currentQuestionIndex === TOTAL_QUESTIONS - 1) {
                setGameState('game_over');
            } else {
                fetchQuestion(currentQuestionIndex + 1);
            }
        } else {
            setGameState('game_over');
        }
    }, 1500); // 1.5 second delay to show host response
  };

  const restartGame = () => {
    setGameState('name_input');
    setPlayerName('');
    setAskedQuestions([]);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswerStatus('unanswered');
    setHostResponse('');
    form.reset();
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
     if (isProcessing && !currentQuestion) {
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
                          !selectedAnswer && `bg-gradient-to-r ${buttonColor.gradient} ${buttonColor.border}`,
                          isSelected && isCorrect && "bg-green-500 border-green-300 animate-pulse ring-4 ring-white",
                          isSelected && !isCorrect && "bg-red-500 border-red-300 animate-pulse ring-4 ring-white",
                          selectedAnswer && !isSelected && !isCorrect && "opacity-40"
                        )}
                      >
                        <span className={cn("flex items-center justify-center h-8 w-8 rounded-full font-black text-white", buttonColor.gradient)}>{key}</span>
                        <span className="text-white">{value}</span>
                      </button>
                    );
                  })}
                </div>
            </div>
            <div className="col-span-2 flex flex-col justify-around items-center gap-4 text-center">
                 <button onClick={handleUseSkip} disabled={lifelines.skip === 0 || !!selectedAnswer} className="flex flex-col items-center gap-1 text-secondary disabled:opacity-40">
                    <SkipForward className="w-10 h-10"/>
                    <span className="font-semibold">Pular ({lifelines.skip})</span>
                 </button>
                 <button onClick={handleUseExperts} disabled={!lifelines.experts || !!selectedAnswer} className="flex flex-col items-center gap-1 text-primary disabled:opacity-40">
                    <GraduationCap className="w-10 h-10"/>
                    <span className="font-semibold">Convidado</span>
                 </button>
                 <button onClick={handleUseCards} disabled={!lifelines.cards || !!selectedAnswer} className="flex flex-col items-center gap-1 text-cyan-400 disabled:opacity-40">
                    <Layers className="w-10 h-10"/>
                    <span className="font-semibold">Cartas</span>
                 </button>
                 <button onClick={handleUseAudience} disabled={!lifelines.audience || !!selectedAnswer} className="flex flex-col items-center gap-1 text-orange-400 disabled:opacity-40">
                    <Users className="w-10 h-10"/>
                    <span className="font-semibold">Platéia</span>
                 </button>
            </div>
           </div>
           
           <Progress value={((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100} className="w-full h-4 bg-black/30 border border-border" indicatorClassName="bg-gradient-to-r from-orange-400 via-yellow-400 to-pink-500" />
            
           {selectedAnswer && (
              <div className="w-full text-center mt-4 animate-fade-in">
                  <p className="text-2xl font-bold text-shadow-neon-yellow">{hostResponse}</p>
                  {isProcessing && handleNextWithDelay()}
              </div>
            )}
        </div>
      );
  }

  const renderContent = () => {
    switch(gameState) {
      case 'name_input':
        return (
          <div className="flex flex-col items-center justify-center text-center w-full max-w-2xl p-4">
            <Logo />
            <p className="max-w-xl text-xl text-white/80 my-8">
              Para começar sua jornada rumo ao prêmio fictício de R$ 1 Milhão, por favor, diga-nos seu nome.
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(data => startGame(data.name))} className="flex flex-col items-center gap-4 w-full max-w-sm">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input placeholder="Seu nome..." autoComplete="off" {...field} className="bg-black/30 border-2 border-primary/50 text-center text-lg h-14 ring-offset-background focus:ring-2 focus:ring-ring" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" className="text-xl font-bold px-12 py-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/50 border-2 border-white/30 animate-pulse-slow">
                  COMEÇAR
                </Button>
              </form>
            </Form>
          </div>
        );
      case 'game_over':
        const isWinner = answerStatus === 'correct' && currentQuestionIndex === TOTAL_QUESTIONS - 1;
        const checkpointTier = [...PRIZE_TIERS].slice(0, isWinner ? TOTAL_QUESTIONS : currentQuestionIndex).reverse().find(p => p.isCheckpoint);
        const prizeWon = isWinner ? PRIZE_TIERS[TOTAL_QUESTIONS - 1].amount : (checkpointTier ? checkpointTier.amount : 0);
        
        return (
          <div className="flex flex-col items-center justify-center text-center w-full max-w-2xl animate-fade-in">
            <Crown className="h-24 w-24 text-secondary animate-pulse-slow" style={{ filter: 'drop-shadow(0 0 15px hsl(var(--secondary)))' }}/>
            <h1 className="text-4xl md:text-6xl font-black mt-4 text-shadow-neon-yellow">Fim de Jogo!</h1>
            <p className="text-2xl mt-4 text-white/80">
              {isWinner ? `Parabéns, ${playerName}!` : `Que pena, ${playerName}!`}
            </p>
            <p className="max-w-xl text-lg text-white/80 my-8">
              {isWinner 
                ? `Você é a nova milionária do nosso quiz! Você ganhou o prêmio máximo de R$ ${prizeWon.toLocaleString('pt-BR')},00 (fictícios)! 👑`
                : `Você leva para casa o prêmio garantido de R$ ${prizeWon.toLocaleString('pt-BR')},00 (fictícios).`
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
        <div className="p-1 bg-gradient-to-br from-neon-orange via-neon-pink to-neon-blue rounded-2xl">
            <div className="bg-dark-bg p-6 rounded-xl min-h-[600px] flex items-center justify-center">
                {renderContent()}
            </div>
        </div>
      </div>
      <AlertDialog open={dialogContent !== null} onOpenChange={() => setDialogContent(null)}>
        <AlertDialogContent>
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
