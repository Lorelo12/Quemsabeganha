'use client';

import { gameShowHost } from '@/ai/flows/game-show-host';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { QUESTIONS, PRIZE_TIERS } from '@/lib/questions';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Crown, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Logo } from './logo';
import { PrizeLadder } from './prize-ladder';

type GameState = 'welcome' | 'playing' | 'result' | 'gameOver';

const nameSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
});

export default function GameClient() {
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [playerName, setPlayerName] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hostResponse, setHostResponse] = useState('');
  const [selectedAnswerKey, setSelectedAnswerKey] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [finalPrize, setFinalPrize] = useState<number | null>(null);

  const { toast } = useToast();

  const form = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (gameState === 'playing' && currentQuestionIndex === 0 && playerName) {
      setHostResponse(`Bem-vindo(a) ao auditório do Quiz Milionário, ${playerName}! Prepare-se para a primeira pergunta valendo R$ 1.000,00 fictícios. Vamos lá!`);
    }
  }, [gameState, currentQuestionIndex, playerName]);
  
  const handleNameSubmit = (values: z.infer<typeof nameSchema>) => {
    setPlayerName(values.name);
    setGameState('playing');
  };

  const handleAnswer = async (answerKey: string) => {
    setIsLoading(true);
    setSelectedAnswerKey(answerKey);

    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const correct = answerKey === currentQuestion.correctAnswerKey;
    setIsCorrect(correct);

    const currentPrize = currentQuestionIndex > 0 ? PRIZE_TIERS[currentQuestionIndex - 1].amount : 0;
    const nextPrize = PRIZE_TIERS[currentQuestionIndex].amount;

    const checkpointTier = [...PRIZE_TIERS]
      .slice(0, currentQuestionIndex)
      .reverse()
      .find(p => p.isCheckpoint);
    const checkpointPrize = checkpointTier ? checkpointTier.amount : 0;
    
    try {
      const res = await gameShowHost({
        playerName,
        question: currentQuestion.question,
        answer: `${answerKey}: ${currentQuestion.options[answerKey]}`,
        isCorrect: correct,
        currentPrize: nextPrize,
        checkpoint: checkpointPrize,
      });
      setHostResponse(res.response);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível contatar a apresentadora. Verifique sua conexão.",
        variant: "destructive",
      });
      setHostResponse(correct ? "Resposta Certa! Mas nossa apresentadora está com problemas técnicos." : "Que pena, você errou. E nossa apresentadora está com problemas técnicos.");
    } finally {
      setIsLoading(false);
      setGameState('result');
    }
  };

  const handleNext = () => {
    if (isCorrect) {
      if (currentQuestionIndex === QUESTIONS.length - 1) {
        setFinalPrize(PRIZE_TIERS[currentQuestionIndex].amount);
        setGameState('gameOver');
        setHostResponse(`Parabéns, ${playerName}! Você zerou o Quiz Milionário e ganhou o prêmio máximo de R$ 1.000.000,00 (fictícios)! Você é uma lenda!`);
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setGameState('playing');
        setSelectedAnswerKey(null);
        setIsCorrect(null);
        setHostResponse(`Vamos para a próxima pergunta, valendo R$ ${PRIZE_TIERS[currentQuestionIndex + 1].label}!`);
      }
    } else {
      const checkpointTier = [...PRIZE_TIERS]
        .slice(0, currentQuestionIndex)
        .reverse()
        .find(p => p.isCheckpoint);
      
      const prizeWon = checkpointTier ? checkpointTier.amount : 0;
      setFinalPrize(prizeWon);
      setGameState('gameOver');
      setHostResponse(`Que pena, ${playerName}! A resposta estava incorreta. Mas você não sai de mãos abanando e leva para casa R$ ${prizeWon.toLocaleString('pt-BR')},00 (fictícios).`);
    }
  };

  const restartGame = () => {
    setGameState('welcome');
    setPlayerName('');
    setCurrentQuestionIndex(0);
    setHostResponse('');
    setSelectedAnswerKey(null);
    setIsCorrect(null);
    setFinalPrize(null);
    form.reset();
  };

  if (gameState === 'welcome') {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Logo />
            </div>
            <CardTitle className="font-headline text-3xl">Bem-vindo(a)!</CardTitle>
            <CardDescription>Para começar, por favor, insira seu nome.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleNameSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Maria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Começar a Jogar
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
       <div className="w-full max-w-2xl mx-auto animate-fade-in text-center">
        <Card className="shadow-2xl">
          <CardHeader>
            <div className="mx-auto mb-4">
              <Crown className="w-24 h-24 text-accent animate-bounce" />
            </div>
            <CardTitle className="font-headline text-4xl">Fim de Jogo!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">{hostResponse}</p>
            <div className="text-5xl font-bold font-headline text-primary p-4 bg-primary/10 rounded-lg">
              R$ {finalPrize?.toLocaleString('pt-BR')},00
            </div>
             <p className="text-sm text-muted-foreground">(prêmio fictício)</p>
            <Button onClick={restartGame} className="mt-6">Jogar Novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = QUESTIONS[currentQuestionIndex];

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <Logo />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <Card className="min-h-[120px] flex items-center justify-center p-6 shadow-lg">
             <p className="text-center text-lg font-medium text-primary-foreground bg-primary rounded-lg p-4 w-full">{hostResponse}</p>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Pergunta {currentQuestionIndex + 1}</CardTitle>
              <CardDescription>Valendo R$ {PRIZE_TIERS[currentQuestionIndex].label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-6 font-semibold">{currentQuestion.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  const isSelected = selectedAnswerKey === key;
                  const isAnswered = selectedAnswerKey !== null;
                  const isTheCorrectAnswer = key === currentQuestion.correctAnswerKey;

                  return (
                    <Button
                      key={key}
                      onClick={() => handleAnswer(key)}
                      disabled={isLoading || isAnswered}
                      className={cn(
                        "justify-start p-6 h-auto text-base whitespace-normal text-left transition-all duration-300",
                        isAnswered && isTheCorrectAnswer && "bg-green-500 hover:bg-green-600 animate-pulse",
                        isAnswered && isSelected && !isCorrect && "bg-red-500 hover:bg-red-600",
                        !isAnswered && "hover:bg-primary/80"
                      )}
                    >
                      <span className="font-bold mr-2">{key}:</span> {value}
                       {isAnswered && isTheCorrectAnswer && <CheckCircle2 className="ml-auto h-6 w-6" />}
                       {isAnswered && isSelected && !isCorrect && <XCircle className="ml-auto h-6 w-6" />}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
           {gameState === 'result' && (
            <div className="text-center animate-fade-in">
                <Button onClick={handleNext} size="lg" disabled={isLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {isLoading ? <Loader2 className="animate-spin" /> : (isCorrect ? 'Próxima Pergunta' : 'Ver Resultado Final')}
                </Button>
            </div>
           )}
        </div>

        <div className="lg:col-span-1">
          <PrizeLadder prizes={PRIZE_TIERS} currentQuestionIndex={currentQuestionIndex} />
        </div>
      </div>
    </div>
  );
}
