'use client';

import { gameShowHost } from '@/ai/flows/game-show-host';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { getAudiencePoll, type AudiencePollOutput } from '@/ai/flows/audience-poll-flow';
import { getExpertsOpinion, type ExpertsOpinionOutput } from '@/ai/flows/experts-opinion-flow';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
} from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


import { useToast } from '@/hooks/use-toast';
import { PRIZE_TIERS } from '@/lib/questions';
import type { Question, LifelineState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Loader2, Crown, Layers, Users, GraduationCap, SkipForward, CircleDollarSign, Gem, BarChart2, Lightbulb, Info, Trophy, MessageSquarePlus, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Logo } from './logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { PrizeTable } from './prize-table';

type GameState = 'auth' | 'playing' | 'game_over';
type AuthView = 'guest' | 'login';
type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';
type InfoDialog = 'ranking' | 'ajuda' | 'creditos' | 'feedback';
type LeaderboardEntry = { player_name: string; score: number };

const TOTAL_QUESTIONS = 16;

const answerButtonColors: { [key: string]: { gradient: string } } = {
  A: { gradient: 'from-purple-500 to-indigo-600' },
  B: { gradient: 'from-blue-400 to-cyan-500' },
  C: { gradient: 'from-yellow-400 to-orange-500' },
  D: { gradient: 'from-pink-500 to-red-600' },
};


export default function GameClient() {
  const [gameState, setGameState] = useState<GameState>('auth');
  const [authView, setAuthView] = useState<AuthView>('guest');
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('signup');

  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
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
  const [infoDialog, setInfoDialog] = useState<InfoDialog | null>(null);
  const [audienceData, setAudienceData] = useState<AudiencePollOutput | null>(null);
  const [expertsData, setExpertsData] = useState<ExpertsOpinionOutput | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [prizeWon, setPrizeWon] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

  const [isAiConfigured, setIsAiConfigured] = useState(true);

  const currentQuestion = quizQuestions[currentQuestionIndex] ?? null;

  useEffect(() => {
    const keyIsPresent = !!process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    setIsAiConfigured(keyIsPresent);
  }, []);
  
  const resetLifelines = () => {
    setLifelines({ skip: 3, cards: true, audience: true, experts: true });
    setDisabledOptions([]);
  }

  const startGame = useCallback(async () => {
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
    try {
        const newQuestions = await generateQuiz();
        if (newQuestions.length !== TOTAL_QUESTIONS) {
            console.error("Generated wrong number of questions:", newQuestions.length);
            throw new Error("Failed to generate the correct number of questions.");
        }
        setQuizQuestions(newQuestions);
    } catch (error) {
        console.error("Failed to fetch quiz:", error);
        toast({
            title: "Erro na Geração do Quiz",
            description: "Não foi possível criar as perguntas do quiz. Verifique sua chave de API do Google e tente recomeçar o jogo.",
            variant: "destructive",
        });
        setGameState('game_over');
    } finally {
        setIsProcessing(false);
    }
  }, [toast]);
  
  const handleGuestStart = () => {
    if (isProcessing || !isAiConfigured) return;
    startGame();
  };

  const handleStartGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !isAiConfigured) return;
    
    if (!auth) {
      toast({
        title: "Firebase não configurado",
        description: "Adicione as chaves do Firebase ao seu arquivo .env para habilitar a autenticação.",
        variant: "destructive",
        duration: 9000,
      });
      return;
    }
    
    setIsProcessing(true);

    if (authTab === 'signup') {
      if (!playerName.trim() || !email || !password) {
        toast({ title: "Todos os campos são obrigatórios para criar a conta.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: playerName });
          setPlayerName(playerName);
          toast({ title: "Conta criada com sucesso!", description: "Começando o jogo..." });
          startGame();
        }
      } catch (error: any) {
        const errorCode = error.code;
        let friendlyMessage = "Ocorreu um erro ao criar a conta.";
        if (errorCode === 'auth/email-already-in-use') {
          friendlyMessage = "Este e-mail já está em uso. Tente fazer login.";
        } else if (errorCode === 'auth/weak-password') {
          friendlyMessage = "A senha é muito fraca. Tente uma com pelo menos 6 caracteres.";
        }
        toast({ title: "Erro no Cadastro", description: friendlyMessage, variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    } else { // authTab === 'login'
      if (!email || !password) {
        toast({ title: "Email e senha são obrigatórios.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setPlayerName(userCredential.user.displayName || 'Jogador(a)');
        toast({ title: "Login realizado com sucesso!", description: "Bem-vindo(a) de volta!" });
        startGame();
      } catch (error: any) {
        const errorCode = error.code;
        let friendlyMessage = "Ocorreu um erro ao fazer login.";
        if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
            friendlyMessage = "Email ou senha incorretos.";
        }
        toast({ title: "Erro no Login", description: friendlyMessage, variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleLogout = async () => {
    if (isProcessing) return;
    if (!auth) {
      toast({ title: "Erro ao sair", description: "Configuração do Firebase não encontrada.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
        await signOut(auth);
        toast({ title: "Você saiu.", description: "Até a próxima!" });
        restartGame();
    } catch (error) {
        toast({ title: "Erro ao sair", description: "Tente novamente.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  }

  const saveScore = useCallback(async (score: number) => {
      if (!supabase || !auth?.currentUser || !auth.currentUser.displayName || score <= 0) return;
      try {
          const { error } = await supabase
              .from('scores')
              .insert({ 
                  player_name: auth.currentUser.displayName, 
                  score: score, 
                  user_id: auth.currentUser.uid 
              });
          if (error) throw error;
      } catch (error) {
          console.error('Error saving score:', error);
          toast({ title: "Erro ao salvar pontuação no ranking.", variant: "destructive" });
      }
  }, [toast]);

  useEffect(() => {
    if (gameState === 'game_over') {
      let finalPrize = 0;

      if (gaveUp) {
        // Prize is the amount from the previous correctly answered question
        finalPrize = currentQuestionIndex > 0 ? PRIZE_TIERS[currentQuestionIndex - 1].amount : 0;
      } else {
        const isWinner = answerStatus === 'correct' && currentQuestionIndex === TOTAL_QUESTIONS - 1;
        if (isWinner) {
          finalPrize = PRIZE_TIERS[TOTAL_QUESTIONS - 1].amount;
        } else { // Incorrect answer
          const lastCheckpointIndex = PRIZE_TIERS.slice(0, currentQuestionIndex)
            .map(p => p.isCheckpoint)
            .lastIndexOf(true);
          finalPrize = lastCheckpointIndex !== -1 ? PRIZE_TIERS[lastCheckpointIndex].amount : 0;
        }
      }
      
      setPrizeWon(finalPrize);
      if (finalPrize > 0) {
        saveScore(finalPrize);
      }
    }
  }, [gameState, answerStatus, currentQuestionIndex, saveScore, gaveUp]);

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
    }, 2500);

    return () => clearTimeout(timer);
  }, [hostResponse, answerStatus, currentQuestionIndex]);


  const handleAnswer = async (answerKey: string) => {
    if (!currentQuestion) return;
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
      const res = await gameShowHost({ playerName: playerName || "Jogador(a)", question: currentQuestion.question, answer: answerKey, isCorrect: isCorrect, currentPrize: nextPrize, prizeOnFailure: prizeOnFailure });
      setHostResponse(res.response);
    } catch (error) {
      console.error(error);
      setHostResponse(isCorrect ? 'Resposta certa!' : 'Resposta errada.');
    }
  };

  const restartGame = () => {
    setGameState('auth');
    setAuthView('guest');
    setPlayerName('');
    setEmail('');
    setPassword('');
    setAuthTab('signup');
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswerStatus('unanswered');
    setHostResponse('');
    setGaveUp(false);
    setPrizeWon(0);
    setLeaderboard(null);
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

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      toast({
        title: "Campo Vazio",
        description: "Por favor, escreva seu feedback antes de enviar.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Feedback submitted:", feedbackText);

    setInfoDialog(null);
    setFeedbackText('');
    
    toast({
      title: "Feedback Enviado!",
      description: "Obrigado pela sua contribuição. Sua opinião é muito importante!",
    });
  };

  const fetchLeaderboard = async () => {
      if (!supabase) {
        toast({ title: "Funcionalidade desabilitada", description: "O ranking não está configurado. Adicione as chaves do Supabase no .env", variant: "destructive" });
        return;
      };
      setIsLeaderboardLoading(true);
      try {
        const { data, error } = await supabase
          .from('scores')
          .select('player_name, score')
          .order('score', { ascending: false })
          .limit(10);

        if (error) throw error;
        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboard([]);
        toast({ title: "Erro ao carregar o ranking.", variant: "destructive" });
      } finally {
        setIsLeaderboardLoading(false);
      }
    };
  
  const renderGameScreen = () => {
     if (isProcessing && quizQuestions.length === 0) {
        return (
           <div className="flex flex-col items-center justify-center gap-4 text-secondary h-96">
             <Loader2 className="h-16 w-16 animate-spin" />
             <p className="text-2xl font-bold text-shadow-neon-yellow">Gerando seu quiz exclusivo...</p>
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
            
            <div className="w-full text-center mt-6">
                <Button 
                    variant="outline" 
                    onClick={handleGiveUp} 
                    disabled={isProcessing || !!selectedAnswer}
                    className="border-secondary text-secondary hover:bg-secondary/20 hover:text-secondary font-bold text-lg py-6 px-8 rounded-full shadow-lg shadow-secondary/20"
                >
                    <Trophy className="mr-2 h-5 w-5"/>
                    Parar e Pegar o Prêmio
                </Button>
            </div>

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
      case 'auth':
        return (
           <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl p-4 gap-8 animate-fade-in">
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
            <p className="text-2xl text-white/80">
              Mostre que você sabe tudo neste jogo de perguntas e respostas!<br/>Responda a 16 perguntas para ganhar R$ 1.000.000!
            </p>
            
            <Card className="w-full max-w-sm bg-black/30 border-primary/50 p-6">
                {authView === 'guest' ? (
                <>
                    <CardHeader className="p-0 pt-6 mb-4">
                        <CardTitle className="text-2xl">Jogar como Convidado</CardTitle>
                    </CardHeader>
                    <Button onClick={handleGuestStart} size="lg" className="w-full font-bold text-lg" disabled={isProcessing || !isAiConfigured}>
                        {isProcessing ? <Loader2 className="animate-spin" /> : "Jogar Agora"}
                    </Button>
                    <div className="mt-4 text-center text-sm text-white/70">
                        <p>Para seu nome aparecer no ranking...</p>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="inline-block"> {/* Wrapper div for disabled button tooltip */}
                                    <Button
                                        variant="link"
                                        className="text-secondary p-0 h-auto text-sm"
                                        onClick={() => setAuthView('login')}
                                        disabled={!auth}
                                    >
                                        Crie uma conta ou faça login &rarr;
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {!auth && (
                                <TooltipContent>
                                    <p>Configure o Firebase no .env para habilitar o login.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </div>
                </>
                ) : (
                <>
                    <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                            <TabsTrigger value="login">Login</TabsTrigger>
                        </TabsList>
                        <TabsContent value="signup">
                        <CardHeader className="p-0 pt-6 mb-4">
                            <CardTitle className="text-2xl">Crie sua Conta</CardTitle>
                            <CardDescription>Crie seu apelido único para entrar no ranking!</CardDescription>
                        </CardHeader>
                            <form onSubmit={handleStartGame} className="space-y-4">
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="nickname" className="text-white/80">Apelido</Label>
                                    <Input id="nickname" placeholder="Seu nome no jogo" value={playerName} onChange={(e) => setPlayerName(e.target.value)} required className="bg-black/30"/>
                                </div>
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="email-signup" className="text-white/80">Email</Label>
                                    <Input id="email-signup" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-black/30"/>
                                </div>
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="password-signup" className="text-white/80">Senha</Label>
                                    <Input id="password-signup" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-black/30"/>
                                </div>
                                <Button type="submit" size="lg" className="w-full !mt-6 font-bold text-lg" disabled={isProcessing || !isAiConfigured}>
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <><Gem className="mr-2"/>Criar e Jogar</>}
                                </Button>
                            </form>
                        </TabsContent>
                        <TabsContent value="login">
                            <CardHeader className="p-0 pt-6 mb-4">
                            <CardTitle className="text-2xl">Bem-vindo(a) de volta!</CardTitle>
                            <CardDescription>Faça login para continuar sua jornada.</CardDescription>
                        </CardHeader>
                            <form onSubmit={handleStartGame} className="space-y-4">
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="email-login" className="text-white/80">Email</Label>
                                    <Input id="email-login" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-black/30"/>
                                </div>
                                <div className="space-y-2 text-left">
                                    <Label htmlFor="password-login" className="text-white/80">Senha</Label>
                                    <Input id="password-login" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-black/30"/>
                                </div>
                                <Button type="submit" size="lg" className="w-full !mt-6 font-bold text-lg" disabled={isProcessing || !isAiConfigured}>
                                    {isProcessing ? <Loader2 className="animate-spin" /> : "Entrar e Jogar"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                    <div className="mt-4 text-center">
                        <Button variant="link" className="text-secondary p-0 h-auto" onClick={() => setAuthView('guest')}>
                            &larr; Voltar para jogar como convidado
                        </Button>
                    </div>
                </>
                )}
            </Card>

            <div className="flex flex-wrap justify-center gap-4 mt-4">
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="inline-block">
                            <Button
                                variant="ghost"
                                className="text-secondary/80 hover:text-secondary"
                                onClick={() => { setInfoDialog('ranking'); fetchLeaderboard(); }}
                                disabled={!supabase}
                            >
                                <BarChart2 className="mr-2"/> Ranking
                            </Button>
                        </div>
                    </TooltipTrigger>
                    {!supabase && (
                        <TooltipContent>
                            <p>Configure o Supabase no .env para habilitar o ranking.</p>
                        </TooltipContent>
                    )}
                </Tooltip>
                <Button variant="ghost" className="text-secondary/80 hover:text-secondary" onClick={() => setInfoDialog('ajuda')}>
                    <Lightbulb className="mr-2"/> Ajuda
                </Button>
                <Button variant="ghost" className="text-secondary/80 hover:text-secondary" onClick={() => setInfoDialog('creditos')}>
                    <Info className="mr-2"/> Créditos
                </Button>
                <Button variant="ghost" className="text-secondary/80 hover:text-secondary" onClick={() => setInfoDialog('feedback')}>
                    <MessageSquarePlus className="mr-2"/> Feedback
                </Button>
            </div>
          </div>
        );
      case 'game_over':
        const isWinner = !gaveUp && answerStatus === 'correct' && currentQuestionIndex === TOTAL_QUESTIONS - 1;
        
        return (
          <div className="flex flex-col items-center justify-center text-center w-full max-w-2xl animate-fade-in">
            <Crown className="h-24 w-24 text-secondary animate-pulse-slow" style={{ filter: 'drop-shadow(0 0 15px hsl(var(--secondary)))' }}/>
            <h1 className="text-4xl md:text-6xl font-black mt-4 text-shadow-neon-yellow">Fim de Jogo!</h1>
            <p className="text-2xl mt-4 text-white/80">
              {isWinner ? `Parabéns, ${playerName || 'Jogador(a)'}!`
               : gaveUp ? `Uma decisão inteligente, ${playerName || 'Jogador(a)'}!`
               : `Que pena, ${playerName || 'Jogador(a)'}!`}
            </p>
            <p className="max-w-xl text-lg text-white/80 my-8">
              {isWinner 
                ? `Você é a nova milionária do nosso quiz! Você ganhou o prêmio máximo de R$ ${prizeWon.toLocaleString('pt-BR')},00! 👑`
                : gaveUp
                ? `Você decidiu parar e garantir seus ganhos. Você leva para casa o prêmio de R$ ${prizeWon.toLocaleString('pt-BR')},00. Parabéns pela conquista!`
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
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 rounded-3xl bg-black/30 relative">
        {auth?.currentUser && (
            <Button onClick={handleLogout} variant="ghost" className="absolute top-6 right-6 text-secondary z-20 hover:bg-primary/20 hover:text-secondary" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin" /> : "Sair"}
            </Button>
        )}
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

      <Dialog open={infoDialog !== null} onOpenChange={(isOpen) => !isOpen && setInfoDialog(null)}>
        <DialogContent className="bg-dark-bg border-primary shadow-lg shadow-primary/30 text-left">
          <DialogHeader>
            <DialogTitle className="text-2xl text-shadow-neon-pink flex items-center gap-2">
              {infoDialog === 'ranking' && <><Trophy /> Ranking dos Milionários</>}
              {infoDialog === 'ajuda' && <><Lightbulb /> Como Jogar</>}
              {infoDialog === 'creditos' && <><Info /> Créditos</>}
              {infoDialog === 'feedback' && <><MessageSquarePlus /> Feedback & Sugestões</>}
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                {infoDialog === 'ranking' && (
                  <>
                    <div className="space-y-4 pt-4 text-left">
                      <p className="text-sm text-white/80">Veja os melhores jogadores!</p>
                       {isLeaderboardLoading ? (
                        <div className="flex justify-center items-center h-40">
                          <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                      ) : leaderboard && leaderboard.length > 0 ? (
                        <ol className="list-none space-y-3">
                          {leaderboard.map((entry, index) => (
                              <li key={index} className="flex items-center justify-between p-2 bg-black/30 rounded-md">
                                <span className="font-semibold">{index + 1}. {entry.player_name}</span>
                                <span className="font-bold text-secondary">R$ {entry.score.toLocaleString('pt-BR')}</span>
                              </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-center text-white/70 py-10">O ranking está vazio ou não pôde ser carregado.</p>
                      )}
                    </div>
                    <DialogFooter className="!mt-4 sm:!justify-end">
                        <DialogClose asChild><Button>Fechar</Button></DialogClose>
                    </DialogFooter>
                  </>
                )}
                {infoDialog === 'ajuda' && (
                  <>
                    <div className="space-y-4 pt-4 text-left text-white/90 max-h-[60vh] overflow-y-auto pr-2">
                        <p>O objetivo é simples: responda a 16 perguntas de conhecimentos gerais para ganhar o prêmio máximo de R$ 1.000.000!</p>
                        
                        <div>
                            <h3 className="font-bold text-primary mb-2">Ajudas Disponíveis:</h3>
                            <ul className="space-y-1 list-disc list-inside">
                                <li><strong className="text-secondary">Pular:</strong> Você tem 3 chances de pular uma pergunta que não sabe.</li>
                                <li><strong className="text-primary">Convidados:</strong> Pede a opinião de três especialistas fictícios.</li>
                                <li><strong className="text-cyan-400">Cartas:</strong> Remove duas respostas incorretas da tela.</li>
                                <li><strong className="text-orange-400">Platéia:</strong> Mostra a porcentagem de votos da plateia para cada opção.</li>
                            </ul>
                        </div>
                    
                        <div>
                            <h3 className="font-bold text-primary mb-2">Regras de Premiação:</h3>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>A cada resposta correta, você avança para o próximo nível de prêmio.</li>
                                <li>Se preferir não arriscar, você pode <strong className="text-secondary">parar e levar</strong> o valor da última pergunta que acertou.</li>
                                <li>Existem dois <strong className="text-secondary">checkpoints seguros</strong>: na pergunta 5 (R$ 5.000) e na pergunta 10 (R$ 50.000).</li>
                                <li>Se errar, você leva para casa o valor do último checkpoint que alcançou. Se errar antes do primeiro checkpoint, o prêmio é R$ 0.</li>
                            </ul>
                        </div>
                        <p className="text-center font-bold pt-4">Boa sorte! 🍀</p>
                    </div>
                     <DialogFooter className="!mt-4 sm:!justify-end">
                        <DialogClose asChild><Button>Fechar</Button></DialogClose>
                    </DialogFooter>
                  </>
                )}
                {infoDialog === 'creditos' && (
                  <>
                    <div className="space-y-4 pt-4 text-left text-white/90">
                        <p>Este jogo é uma homenagem ao clássico "Show do Milhão" e foi desenvolvido como uma demonstração das capacidades da IA generativa.</p>
                        
                        <div className="text-center py-2">
                            <p>Desenvolvido com 💖 por</p>
                            <p className="font-bold text-lg text-primary text-shadow-neon-pink">Firebase Studio</p>
                        </div>
                    
                        <div>
                            <h3 className="font-bold text-secondary mb-2">Tecnologias Utilizadas:</h3>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Next.js & React</li>
                                <li>Tailwind CSS & ShadCN UI</li>
                                <li>Genkit & Google Gemini</li>
                                <li>Firebase Authentication</li>
                                <li>Supabase</li>
                            </ul>
                        </div>
                    </div>
                     <DialogFooter className="!mt-4 sm:!justify-end">
                        <DialogClose asChild><Button>Fechar</Button></DialogClose>
                    </DialogFooter>
                  </>
                )}
                 {infoDialog === 'feedback' && (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-4 text-left">
                      <p className="text-sm text-white/80">
                        Encontrou um bug ou tem uma ideia para melhorar o jogo? Nós adoraríamos ouvir!
                      </p>
                      <Textarea
                        name="feedback"
                        placeholder="Digite seu feedback aqui..."
                        className="bg-black/30 border-primary/50 text-white"
                        rows={5}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        required
                      />
                      <DialogFooter className="!mt-4 sm:!justify-end">
                        <DialogClose asChild>
                          <Button type="button" variant="ghost">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit">Enviar</Button>
                      </DialogFooter>
                  </form>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
