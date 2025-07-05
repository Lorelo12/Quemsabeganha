'use client';

import { gameShowHost } from '@/ai/flows/game-show-host';
import { generateQuestion } from '@/ai/flows/generate-question-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PRIZE_TIERS } from '@/lib/questions';
import type { Question } from '@/lib/types';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles, Trophy, CheckCircle2, XCircle, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { PrizeLadder } from './prize-ladder';
import { Logo } from './logo';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

type GameState = 'name_input' | 'playing' | 'game_over';
type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';

const TOTAL_QUESTIONS = 16;
const nameSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.').max(50, 'O nome é muito longo.'),
});

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
  const [flash, setFlash] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: '' },
  });

  const startGame = (name: string) => {
    setPlayerName(name);
    setGameState('playing');
    fetchQuestion(0);
  };

  const fetchQuestion = async (index: number) => {
    setIsProcessing(true);
    setCurrentQuestion(null);
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
    setFlash(isCorrect ? 'green' : 'red');
    setTimeout(() => setFlash(null), 700);

    const nextPrize = PRIZE_TIERS[currentQuestionIndex].amount;
    const checkpointTier = [...PRIZE_TIERS].slice(0, currentQuestionIndex).reverse().find(p => p.isCheckpoint);
    const checkpointPrize = checkpointTier ? checkpointTier.amount : 0;

    try {
      const res = await gameShowHost({ playerName, question: currentQuestion.question, answer: answerKey, isCorrect: isCorrect, currentPrize: nextPrize, checkpoint: checkpointPrize });
      setHostResponse(res.response);
    } catch (error) {
      console.error(error);
      setHostResponse(isCorrect ? 'Resposta certa!' : 'Resposta errada.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    if (answerStatus === 'correct') {
      if (currentQuestionIndex === TOTAL_QUESTIONS - 1) {
        setGameState('game_over');
      } else {
        fetchQuestion(currentQuestionIndex + 1);
      }
    } else {
      setGameState('game_over');
    }
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

  if (gameState === 'name_input') {
    return (
      <div className="flex flex-col items-center justify-center text-center h-screen w-full p-4">
        <Logo />
        <p className="max-w-xl text-lg text-foreground/80 my-8">
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
                    <Input placeholder="Seu nome..." autoComplete="off" {...field} className="bg-background text-center text-lg h-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="text-xl font-bold px-12 py-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-accent/50 border-2 border-accent/20">
              Confirmar
            </Button>
          </form>
        </Form>
      </div>
    );
  }

  if (gameState === 'game_over') {
    const isWinner = answerStatus === 'correct' && currentQuestionIndex === TOTAL_QUESTIONS - 1;
    const checkpointTier = [...PRIZE_TIERS].slice(0, isWinner ? TOTAL_QUESTIONS : currentQuestionIndex).reverse().find(p => p.isCheckpoint);
    const prizeWon = isWinner ? PRIZE_TIERS[TOTAL_QUESTIONS - 1].amount : (checkpointTier ? checkpointTier.amount : 0);
    
    return (
      <div className="flex flex-col items-center justify-center text-center h-screen w-full p-4 animate-fade-in">
        <Crown className="h-24 w-24 text-accent animate-pulse-slow" />
        <h1 className="text-4xl md:text-6xl font-bold mt-4">Fim de Jogo!</h1>
        <p className="text-2xl mt-4 text-foreground/80">
          {isWinner ? `Parabéns, ${playerName}!` : `Que pena, ${playerName}!`}
        </p>
        <p className="max-w-xl text-lg text-foreground/80 my-8">
          {isWinner 
            ? `Você é a nova milionária do nosso quiz! Você ganhou o prêmio máximo de R$ ${prizeWon.toLocaleString('pt-BR')},00 (fictícios)! 👑`
            : `Você leva para casa o prêmio garantido de R$ ${prizeWon.toLocaleString('pt-BR')},00 (fictícios).`
          }
        </p>
         <Button onClick={restartGame} size="lg" className="animate-pulse-slow text-xl font-bold px-12 py-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-accent/50 border-2 border-accent/20">
          Jogar Novamente 💖
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-12 gap-6 w-full max-w-7xl mx-auto p-4 min-h-screen">
      <main className={cn(
        "md:col-span-8 lg:col-span-9 flex flex-col justify-center items-center gap-6 p-4 rounded-lg transition-colors duration-500",
        flash === 'green' && 'bg-green-500/20',
        flash === 'red' && 'bg-red-500/20'
      )}>
        {isProcessing && !currentQuestion && (
           <div className="flex flex-col items-center gap-4 text-primary-foreground">
             <Loader2 className="h-12 w-12 animate-spin" />
             <p className="text-xl">Nossa produção está preparando a pergunta...</p>
           </div>
        )}
        {currentQuestion && (
          <div className="w-full max-w-3xl flex flex-col gap-6 animate-fade-in">
            <Card className="text-center shadow-xl border-2 border-primary/20" >
              <CardHeader>
                <CardTitle className="text-lg md:text-xl font-normal text-muted-foreground">
                  Pergunta {currentQuestionIndex + 1} <span className="font-bold text-primary-foreground">Valendo R$ {PRIZE_TIERS[currentQuestionIndex].label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{currentQuestion.question}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                const isSelected = selectedAnswer === key;
                const isCorrect = currentQuestion.correctAnswerKey === key;
                
                return (
                  <Button
                    key={key}
                    variant="outline"
                    className={cn(
                      "justify-start h-auto p-4 text-lg whitespace-normal text-left bg-card hover:bg-primary/20 border-primary/40 disabled:opacity-100",
                      selectedAnswer && isCorrect && "bg-green-200 border-green-500 text-green-900 animate-pulse",
                      selectedAnswer && isSelected && !isCorrect && "bg-red-200 border-red-500 text-red-900",
                    )}
                    onClick={() => handleAnswer(key)}
                    disabled={selectedAnswer !== 'unanswered' || isProcessing}
                  >
                    <span className="font-bold mr-3 text-primary-foreground">{key}:</span> {value}
                  </Button>
                );
              })}
            </div>

            {selectedAnswer && (
              <Card className={cn(
                  "text-center shadow-lg animate-fade-in border-2",
                  answerStatus === 'correct' && 'border-green-500',
                  answerStatus === 'incorrect' && 'border-red-500',
              )}>
                <CardContent className="p-4 flex flex-col items-center gap-4">
                  <p className="text-lg font-medium">{hostResponse}</p>
                  <Button onClick={handleNext}>
                    {answerStatus === 'correct' ? (currentQuestionIndex === TOTAL_QUESTIONS - 1 ? 'Ver prêmio final!' : 'Próxima Pergunta') : 'Ver Resultado Final'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
      <aside className="hidden md:block md:col-span-4 lg:col-span-3 py-4">
        <PrizeLadder prizes={PRIZE_TIERS} currentQuestionIndex={currentQuestionIndex} />
        <p className="text-center text-xs text-muted-foreground mt-4">*Este jogo é apenas para fins de entretenimento. Os valores são fictícios.</p>
      </aside>
    </div>
  );
}
