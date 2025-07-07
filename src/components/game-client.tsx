'use client';

import { gameShowHost } from '@/ai/flows/game-show-host';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { getAudiencePoll, type AudiencePollOutput } from '@/ai/flows/audience-poll-flow';
import { getExpertsOpinion, type ExpertsOpinionOutput } from '@/ai/flows/experts-opinion-flow';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  type User,
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
import { ScrollArea } from '@/components/ui/scroll-area';


import { useToast } from '@/hooks/use-toast';
import { PRIZE_TIERS } from '@/lib/questions';
import type { Question, LifelineState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Loader2, Crown, Layers, Users, GraduationCap, SkipForward, CircleDollarSign, Gem, BarChart2, Lightbulb, Info, Trophy, MessageSquarePlus, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Logo } from './logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

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

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.021,35.591,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export default function GameClient() {
  const [gameState, setGameState] = useState<GameState>('auth');
  const [authView, setAuthView] = useState<AuthView>('guest');
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('signup');
  const [user, setUser] = useState<User | null>(null);

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

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setPlayerName(currentUser.displayName || 'Jogador(a)');
      } else {
        setPlayerName('');
      }
    });
    return () => unsubscribe();
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
            throw new Error("Failed to generate the correct number of questions.");
        }
        setQuizQuestions(newQuestions);
    } catch (error) {
        toast({
            title: "Erro na Geração do Quiz",
            description: "Não foi possível criar as perguntas. Verifique sua chave de API do Google e tente recomeçar.",
            variant: "destructive",
        });
        setGameState('game_over');
    } finally {
        setIsProcessing(false);
    }
  }, [toast]);
  
  const handleGuestStart = () => {
    if (isProcessing) return;
    startGame();
  };

  const handleStartGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !auth) return;
    
    setIsProcessing(true);

    if (authTab === 'signup') {
      if (!playerName.trim() || !email || !password) {
        toast({ title: "Todos os campos são obrigatórios para criar a conta.", variant: "destructive" });
        setIsProcessing(false);
        return;
      }
      
      if (supabase) {
        const { data: existingPlayer } = await supabase
          .from('scores')
          .select('player_name')
          .eq('player_name', playerName.trim())
          .maybeSingle();
        
        if (existingPlayer) {
          toast({ title: "Apelido já em uso", description: "Este apelido já foi escolhido por outro jogador. Por favor, tente outro.", variant: "destructive" });
          setIsProcessing(false);
          return;
        }
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: playerName });
          setUser(userCredential.user);
          toast({ title: "Conta criada com sucesso!", description: "Bem-vindo(a)!" });
        }
      } catch (error: any) {
        console.error("Firebase signup error:", error);
        const errorCode = error.code;
        let friendlyMessage;
        
        switch (errorCode) {
            case 'auth/email-already-in-use':
                friendlyMessage = "Este e-mail já está em uso. Tente fazer login.";
                break;
            case 'auth/weak-password':
                friendlyMessage = "A senha é muito fraca. Use pelo menos 6 caracteres.";
                break;
            case 'auth/operation-not-allowed':
                friendlyMessage = "Cadastro por Email/Senha não está ativado no seu projeto Firebase.";
                break;
            case 'auth/unauthorized-domain':
                friendlyMessage = "O domínio do app não está autorizado. Adicione-o na lista de 'Domínios Autorizados' nas configurações de autenticação do seu projeto Firebase.";
                break;
            case 'auth/invalid-email':
                friendlyMessage = "O e-mail fornecido não é válido.";
                break;
            case 'auth/api-key-not-valid':
                friendlyMessage = "A chave de API do Firebase é inválida. Copie a chave correta das configurações do seu projeto Firebase e cole-a no arquivo .env.";
                break;
            case 'auth/configuration-not-found':
                friendlyMessage = "Falha na configuração do Firebase. A chave de API (apiKey) no arquivo .env parece estar incorreta.";
                break;
            default:
                friendlyMessage = "Ocorreu um erro inesperado ao criar a conta.";
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
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Login realizado com sucesso!", description: "Bem-vindo(a) de volta!" });
      } catch (error: any) {
        console.error("Firebase login error:", error);
        const errorCode = error.code;
        let friendlyMessage;

        switch (errorCode) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                friendlyMessage = "Email ou senha incorretos.";
                break;
            case 'auth/invalid-email':
                friendlyMessage = "O e-mail fornecido não é válido.";
                break;
            case 'auth/operation-not-allowed':
                friendlyMessage = "Login por Email/Senha não está ativado. Habilite-o no seu Console do Firebase.";
                break;
            case 'auth/unauthorized-domain':
                friendlyMessage = "O domínio do app não está autorizado. Adicione-o na lista de 'Domínios Autorizados' nas configurações de autenticação do seu projeto Firebase.";
                break;
             case 'auth/api-key-not-valid':
                friendlyMessage = "A chave de API do Firebase é inválida. Copie a chave correta das configurações do seu projeto Firebase e cole-a no arquivo .env.";
                break;
            case 'auth/configuration-not-found':
                friendlyMessage = "Falha na configuração do Firebase. Verifique se as chaves em seu arquivo .env estão corretas.";
                break;
            default:
                friendlyMessage = "Ocorreu um erro inesperado ao fazer login.";
        }

        toast({ title: "Erro no Login", description: friendlyMessage, variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (isProcessing || !auth) return;

    setIsProcessing(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      const errorCode = error.code;
      let friendlyMessage = "Ocorreu um erro ao fazer login com o Google.";

      switch (errorCode) {
        case 'auth/popup-closed-by-user':
          friendlyMessage = "A janela de login foi fechada. Tente novamente.";
          break;
        case 'auth/account-exists-with-different-credential':
          friendlyMessage = "Já existe uma conta com este e-mail. Tente fazer login com outro método.";
          break;
        case 'auth/operation-not-allowed':
          friendlyMessage = "Login com Google não está ativado. Habilite-o no seu Console do Firebase.";
          break;
        case 'auth/unauthorized-domain':
          friendlyMessage = "O domínio do app não está autorizado. Por favor, adicione-o na lista de 'Domínios Autorizados' nas configurações de autenticação do seu projeto Firebase.";
          break;
        case 'auth/api-key-not-valid':
          friendlyMessage = "A chave de API do Firebase é inválida. Copie a chave correta das configurações do seu projeto Firebase e cole-a no arquivo .env.";
          break;
        case 'auth/configuration-not-found':
          friendlyMessage = "Falha na configuração do Firebase. Verifique se as chaves em seu arquivo .env estão corretas.";
          break;
        default:
          break;
      }
      toast({ title: "Erro no Login com Google", description: friendlyMessage, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    if (isProcessing || !auth) return;
    
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
    if (!supabase || !auth?.currentUser?.uid || !auth.currentUser.displayName || score <= 0) return;
    
    try {
      const { error } = await supabase.rpc('upsert_player_score', {
        p_user_id: auth.currentUser.uid,
        p_player_name: auth.currentUser.displayName,
        p_score: score
      });

      if (error) throw error;
    } catch (error: any) {
        console.error("Supabase save score error message:", error.message || error);
        let title = "Erro ao Salvar Pontuação";
        let description = "Não foi possível registrar sua pontuação no ranking.";

        if (error.message?.includes('duplicate key value violates unique constraint "scores_player_name_key"')) {
            title = "Apelido já em uso";
            description = "Este apelido foi registrado por outro jogador enquanto você jogava. Tente um novo jogo com um apelido diferente.";
        } else if (error.message?.includes('violates row-level security policy')) {
            description = "As permissões do banco de dados (RLS) impediram o registro. Verifique as políticas de segurança.";
        } else {
             description = `Ocorreu um erro inesperado. ${error.message ? `Detalhes: ${error.message}` : 'Verifique a configuração do Supabase e as políticas RLS.'}`;
        }
        
        toast({ title, description, variant: "destructive" });
    }
  }, [toast, auth]);

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
    if (finalPrize > 0) {
      saveScore(finalPrize);
    }
  }, [gameState, answerStatus, currentQuestionIndex, gaveUp, saveScore]);


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
      setHostResponse(isCorrect ? 'Resposta certa!' : 'Resposta errada.');
    }
  };

  const restartGame = () => {
    setGameState('auth');
    setAuthView('guest');
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
    
    setInfoDialog(null);
    setFeedbackText('');
    
    toast({
      title: "Feedback Enviado!",
      description: "Obrigado pela sua contribuição. Sua opinião é muito importante!",
    });
  };

  const fetchLeaderboard = async () => {
      if (!supabase) {
        setLeaderboard(null);
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
      } catch (error: any) {
        console.error("Supabase fetch leaderboard error:", error);
        setLeaderboard([]);
        let title = "Erro ao Carregar o Ranking";
        let description = "Não foi possível carregar os dados. Por favor, tente novamente mais tarde.";

        if (error.message.includes('relation "public.scores" does not exist')) {
            description = "A tabela 'scores' não foi encontrada. Siga as instruções de configuração do ranking para criá-la.";
        } else if (error.message.includes('violates row-level security policy')) {
            description = "As permissões do banco de dados (RLS) impediram a leitura. Verifique as políticas de segurança do ranking.";
        }
        toast({ title, description, variant: "destructive" });
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
        if (user) {
          return (
            <div className="flex flex-col items-center justify-center text-center w-full max-w-lg p-4 gap-6 animate-fade-in">
              <Logo />
              <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white">Bem-vindo(a) de volta,</h2>
                  <p className="text-4xl font-black text-shadow-neon-yellow">{playerName}!</p>
              </div>
              <Button onClick={startGame} size="lg" className="w-full font-bold text-lg mt-4 py-8" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="animate-spin" /> : "▶️ Iniciar Novo Jogo"}
              </Button>
               <div className="flex flex-wrap justify-center gap-4 mt-4">
                  <Button
                      variant="ghost"
                      className="text-secondary/80 hover:text-secondary"
                      onClick={() => { setInfoDialog('ranking'); fetchLeaderboard(); }}
                  >
                      <BarChart2 className="mr-2"/> Ranking
                  </Button>
                  <Button variant="ghost" className="text-secondary/80 hover:text-secondary" onClick={() => setInfoDialog('ajuda')}>
                      <Lightbulb className="mr-2"/> Ajuda
                  </Button>
               </div>
            </div>
          );
        }
        return (
           <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl p-4 gap-8 animate-fade-in">
            <Logo />
            
            <p className="text-2xl text-white/80">
              Mostre que você sabe tudo neste jogo de perguntas e respostas!<br/>Responda a 16 perguntas para ganhar R$ 1.000.000!
            </p>
            
            <Card className="w-full max-w-sm bg-black/30 border-primary/50 p-6">
                {authView === 'guest' ? (
                <>
                    <CardHeader className="p-0 pt-6 mb-4">
                        <CardTitle className="text-2xl">Comece a Jogar</CardTitle>
                    </CardHeader>
                    <div className="space-y-4">
                      <Button onClick={handleGuestStart} size="lg" className="w-full font-bold text-lg" disabled={isProcessing}>
                          {isProcessing ? <Loader2 className="animate-spin" /> : "Jogar como Convidado"}
                      </Button>
                      <Button variant="outline" className="w-full font-bold" onClick={handleGoogleSignIn} disabled={isProcessing || !auth}>
                          <GoogleIcon /> Entrar com Google
                      </Button>
                    </div>
                    <div className="mt-4 text-center text-sm text-white/70">
                        <p>Ou, para usar apelido e senha...</p>
                        <Button
                            variant="link"
                            className="text-secondary p-0 h-auto text-sm"
                            onClick={() => setAuthView('login')}
                        >
                            Crie uma conta ou faça login com email &rarr;
                        </Button>
                    </div>
                </>
                ) : (
                <>
                    {!auth && (
                      <Alert variant="destructive" className="mb-4 text-left">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Login/Cadastro Desabilitado</AlertTitle>
                          <AlertDescription>
                              As chaves do Firebase não foram configuradas no arquivo <strong>.env</strong>. Por favor, jogue como convidado.
                          </AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-4">
                        <Button variant="outline" className="w-full font-bold" onClick={handleGoogleSignIn} disabled={isProcessing || !auth}>
                            <GoogleIcon /> Entrar com Google
                        </Button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border/50" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">
                                    Ou use seu email
                                </span>
                            </div>
                        </div>
                    </div>
                    <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                            <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                            <TabsTrigger value="login">Login</TabsTrigger>
                        </TabsList>
                        <TabsContent value="signup">
                        <CardHeader className="p-0 pt-6 mb-4">
                            <CardTitle className="text-xl">Crie sua Conta</CardTitle>
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
                                <Button type="submit" size="lg" className="w-full !mt-6 font-bold text-lg" disabled={isProcessing || !auth}>
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <><Gem className="mr-2"/>Criar Conta e Jogar</>}
                                </Button>
                            </form>
                        </TabsContent>
                        <TabsContent value="login">
                            <CardHeader className="p-0 pt-6 mb-4">
                            <CardTitle className="text-xl">Bem-vindo(a) de volta!</CardTitle>
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
                                <Button type="submit" size="lg" className="w-full !mt-6 font-bold text-lg" disabled={isProcessing || !auth}>
                                    {isProcessing ? <Loader2 className="animate-spin" /> : "Entrar e Jogar"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                    <div className="mt-4 text-center">
                        <Button variant="link" className="text-secondary p-0 h-auto" onClick={() => setAuthView('guest')}>
                            &larr; Voltar
                        </Button>
                    </div>
                </>
                )}
            </Card>

            <div className="flex flex-wrap justify-center gap-4 mt-4">
                <Button
                    variant="ghost"
                    className="text-secondary/80 hover:text-secondary"
                    onClick={() => { setInfoDialog('ranking'); fetchLeaderboard(); }}
                >
                    <BarChart2 className="mr-2"/> Ranking
                </Button>
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

  const renderRankingContent = () => {
    if (!supabase) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ranking Desabilitado</AlertTitle>
                <AlertDescription>
                    Para habilitar o ranking, você precisa configurar o Supabase.
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Crie um projeto no <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">Supabase</a>.</li>
                        <li>Vá para <strong>Project Settings</strong> &gt; <strong>API</strong>.</li>
                        <li>Copie a <strong>URL</strong> e a <strong>chave pública (anon key)</strong>.</li>
                        <li>Cole-as nas variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no seu arquivo <code>.env</code>.</li>
                    </ol>
                </AlertDescription>
            </Alert>
        );
    }

    return (
      <>
        <p className="text-sm text-white/80">Veja os melhores jogadores!</p>
        {isLeaderboardLoading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        ) : leaderboard && leaderboard.length > 0 ? (
            <ol className="list-none space-y-3 mt-4">
                {leaderboard.map((entry, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-black/30 rounded-md">
                        <span className="font-semibold">{index + 1}. {entry.player_name}</span>
                        <span className="font-bold text-secondary">R$ {entry.score.toLocaleString('pt-BR')}</span>
                    </li>
                ))}
            </ol>
        ) : (
            <div className="text-center text-white/70 py-10">
                <p>O ranking está vazio ou não pôde ser carregado.</p>
            </div>
        )}
      </>
    );
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 rounded-3xl bg-black/30 relative">
        {user && (
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
        <DialogContent className="bg-dark-bg border-primary shadow-lg shadow-primary/30 text-left max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-shadow-neon-pink flex items-center gap-2">
              {infoDialog === 'ranking' && <><Trophy /> Ranking dos Milionários</>}
              {infoDialog === 'ajuda' && <><Lightbulb /> Como Jogar</>}
              {infoDialog === 'creditos' && <><Info /> Créditos</>}
              {infoDialog === 'feedback' && <><MessageSquarePlus /> Feedback & Sugestões</>}
            </DialogTitle>
          </DialogHeader>
            <DialogDescription asChild>
              <div>
                {infoDialog === 'ranking' && (
                  <>
                    <div className="space-y-4 pt-4 text-left max-h-[60vh] overflow-y-auto pr-2">
                        {renderRankingContent()}
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
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
