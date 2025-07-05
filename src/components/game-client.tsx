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
import { Clover, CornerDownLeft, Loader2, Lock, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Types
type Message = {
  id: string;
  role: 'host' | 'player' | 'system';
  content: React.ReactNode;
};
type GameState = 'welcome' | 'name_input' | 'playing' | 'answered' | 'game_over';

// Constants
const TOTAL_QUESTIONS = 16;
const nameSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.').max(50, 'O nome é muito longo.'),
});

// Main Component
export default function GameClient() {
  const [gameState, setGameState] = useState<GameState>('welcome');
  const [playerName, setPlayerName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: '' },
  });

  const addMessage = (message: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...message, id: crypto.randomUUID() }]);
  };

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const startGame = (name: string) => {
    setPlayerName(name);
    addMessage({ role: 'player', content: name });
    setGameState('playing');
    fetchQuestion(0);
  };

  const fetchQuestion = async (index: number) => {
    setIsProcessing(true);
    addMessage({ role: 'host', content: <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Nossa produção está preparando a pergunta...</div> });

    try {
      const newQuestion = await generateQuestion({
        difficulty: index + 1,
        previousQuestions: askedQuestions.map(q => q.question),
      });
      setAskedQuestions(prev => [...prev, newQuestion]);
      setCurrentQuestion(newQuestion);
      setCurrentQuestionIndex(index);

      const prize = PRIZE_TIERS[index];
      const prevPrize = PRIZE_TIERS[index - 1];

      if (prevPrize?.isCheckpoint) {
        addMessage({ role: 'system', content: <div className="flex items-center gap-2 font-bold text-accent"><Lock /> Checkpoint! Você garantiu R$ {prevPrize.label}.</div> });
      }

      addMessage({ role: 'host', content: <QuestionDisplay question={newQuestion} prize={prize.label} index={index} onAnswer={handleAnswer} /> });
      setGameState('playing');
    } catch (error) {
      console.error("Failed to fetch question:", error);
      toast({
        title: "Erro na Geração da Pergunta",
        description: "Não foi possível conectar com nossa produção. O jogo será reiniciado.",
        variant: "destructive",
      });
      addMessage({ role: 'system', content: 'Erro ao gerar pergunta. O jogo será reiniciado.' });
      setTimeout(restartGame, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnswer = async (answerKey: string, answerText: string) => {
    if (!currentQuestion) return;
    setIsProcessing(true);
    setGameState('answered');
    addMessage({ role: 'player', content: `${answerKey}) ${answerText}` });

    const correct = answerKey === currentQuestion.correctAnswerKey;
    setIsCorrect(correct);

    const nextPrize = PRIZE_TIERS[currentQuestionIndex].amount;
    const checkpointTier = [...PRIZE_TIERS].slice(0, currentQuestionIndex).reverse().find(p => p.isCheckpoint);
    const checkpointPrize = checkpointTier ? checkpointTier.amount : 0;

    try {
      const res = await gameShowHost({ playerName, question: currentQuestion.question, answer: `${answerKey}: ${answerText}`, isCorrect: correct, currentPrize: nextPrize, checkpoint: checkpointPrize });
      addMessage({ role: 'host', content: <div className="flex flex-col gap-4"><p>{res.response}</p><Button onClick={handleNext} className="self-start">{correct ? (currentQuestionIndex === TOTAL_QUESTIONS - 1 ? 'Ver prêmio final!' : 'Próxima Pergunta') : 'Ver Resultado Final'}</Button></div> });
    } catch (error) {
      console.error(error);
       toast({
        title: "Erro de Conexão",
        description: "Não foi possível contatar a apresentadora. Verifique sua conexão.",
        variant: "destructive",
      });
      addMessage({ role: 'system', content: 'Erro de conexão com a apresentadora.' });
      handleNext();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    if (isCorrect) {
      if (currentQuestionIndex === TOTAL_QUESTIONS - 1) {
        const finalPrize = PRIZE_TIERS[currentQuestionIndex].amount;
        setGameState('game_over');
        addMessage({ role: 'host', content: `Parabéns, ${playerName}! Você zerou o Quiz Milionário e ganhou o prêmio máximo de R$ ${finalPrize.toLocaleString('pt-BR')},00 (fictícios)!` });
        addMessage({ role: 'system', content: <GameOverControls onRestart={restartGame} /> });
      } else {
        fetchQuestion(currentQuestionIndex + 1);
      }
    } else {
      const checkpointTier = [...PRIZE_TIERS].slice(0, currentQuestionIndex).reverse().find(p => p.isCheckpoint);
      const prizeWon = checkpointTier ? checkpointTier.amount : 0;
      setGameState('game_over');
      addMessage({ role: 'host', content: `Que pena, ${playerName}! A resposta estava incorreta. Mas você leva para casa R$ ${prizeWon.toLocaleString('pt-BR')},00 (fictícios).` });
      addMessage({ role: 'system', content: <GameOverControls onRestart={restartGame} /> });
    }
  };

  const restartGame = () => {
    setGameState('welcome');
    setPlayerName('');
    setMessages([]);
    setAskedQuestions([]);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(0);
    setIsCorrect(null);
    form.reset();
  };

  useEffect(() => {
    if (gameState === 'welcome' && messages.length === 0) {
      addMessage({ role: 'host', content: "Bem-vindo(a) ao Quiz Milionário! 🍀 Para começar, por favor, insira seu nome." });
      setGameState('name_input');
    }
  }, [gameState, messages.length]);

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground font-sans">
      <header className="flex items-center justify-center p-4 border-b shrink-0">
         <Clover className="h-8 w-8 text-accent" />
         <h1 className="text-2xl font-bold ml-2">Quiz Milionário</h1>
      </header>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} {...msg} />
        ))}
        {isProcessing && messages[messages.length-1]?.role === 'player' && (
          <ChatMessage id="loading" role="host" content={<div className="flex items-center gap-2"><Loader2 className="animate-spin" /></div>} />
        )}
      </div>

      <footer className="p-4 border-t bg-white/80 backdrop-blur-sm shrink-0">
        {gameState === 'name_input' && !isProcessing && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => startGame(data.name))} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Seu nome..." autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" aria-label="Enviar nome">
                <CornerDownLeft size={16} />
              </Button>
            </form>
          </Form>
        )}
        {gameState !== 'name_input' && (
          <div className="text-center text-xs text-muted-foreground">Este jogo é apenas para fins de entretenimento. Os valores são fictícios.</div>
        )}
      </footer>
    </div>
  );
}

// Sub-components
const ChatMessage = ({ role, content }: Message) => {
  const isHost = role === 'host';
  const isPlayer = role === 'player';
  const isSystem = role === 'system';

  return (
    <div className={cn('flex items-end gap-2 animate-fade-in', { 'justify-start': isHost, 'justify-end': isPlayer, 'justify-center': isSystem })}>
      {isHost && <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white shrink-0"><Sparkles size={20} /></div>}
      <div className={cn('max-w-md md:max-w-lg lg:max-w-xl rounded-lg p-3 text-sm md:text-base shadow-sm', {
        'bg-[#FFF8DC] text-gray-800 rounded-bl-none': isHost,
        'bg-[#E3F2FD] text-black rounded-br-none': isPlayer,
        'bg-transparent text-muted-foreground text-xs italic shadow-none': isSystem,
      })}>
        {content}
      </div>
    </div>
  );
};

const QuestionDisplay = ({ question, prize, index, onAnswer }: { question: Question; prize: string; index: number; onAnswer: (key: string, text: string) => void }) => {
  const [answered, setAnswered] = useState(false);
  const handleSelect = (key: string, text: string) => { setAnswered(true); onAnswer(key, text); };

  return (
    <div className="space-y-4">
      <p className="font-bold">Pergunta {index + 1}, valendo R$ {prize} (fictícios):</p>
      <p className="text-lg">{question.question}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(question.options).map(([key, value]) => (
          <Button key={key} variant="outline" className="justify-start h-auto p-3 whitespace-normal text-left bg-white hover:bg-gray-100 disabled:opacity-100" onClick={() => handleSelect(key, value)} disabled={answered}>
            <span className="font-bold mr-2">{key}:</span> {value}
          </Button>
        ))}
      </div>
    </div>
  );
};

const GameOverControls = ({ onRestart }: { onRestart: () => void }) => (
  <div className="flex justify-center w-full">
    <Button onClick={onRestart}>Recomeçar</Button>
  </div>
);
