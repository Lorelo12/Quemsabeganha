'use client';

import { gameShowHost } from '@/ai/flows/game-show-host';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import { getAudiencePoll, type AudiencePollOutput } from '@/ai/flows/audience-poll-flow';
import { getExpertsOpinion, type ExpertsOpinionOutput } from '@/ai/flows/experts-opinion-flow';
import { auth, isFirebaseConfigured, handleGoogleSignIn } from '@/lib/firebase';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,
} from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PrizeLadder } from '@/components/prize-ladder';
import { Card } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';
import { PRIZE_TIERS } from '@/lib/questions';
import type { Question, LifelineState, LeaderboardEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Loader2, Crown, Layers, Users, GraduationCap, Trophy, LogOut, ScrollText, AlertTriangle, BarChart2, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Logo } from './logo';

type GameState = 'auth' | 'playing' | 'game_over';
type AuthView = 'guest' | 'login';
type AnswerStatus = 'unanswered' | 'correct' | 'incorrect';
type InfoDialog = 'ranking' | 'ajuda' | 'creditos';

const TOTAL_QUESTIONS = 16;

const answerButtonColors: { [key: string]: { gradient: string, border: string } } = {
  A: { gradient: 'from-purple-500 to-indigo-600', border: 'border-purple-400' },
  B: { gradient: 'from-blue-500 to-cyan-500', border: 'border-blue-400' },
  C: { gradient: 'from-yellow-500 to-orange-500', border: 'border-yellow-400' },
  D: { gradient: 'from-pink-500 to-red-600', border: 'border-pink-400' },
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
    cards: true,
    audience: true,
    experts: true,
  });
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  const [dialogContent, setDialogContent] = useState<'audience' | 'experts' | null>(null);
  const [infoDialog, setInfoDialog] = useState<InfoDialog | null>(null);
  const [audienceData, setAudienceData] = useState<AudiencePollOutput | null>(null);
  const [expertsData, setExpertsData] = useState<ExpertsOpinionOutput | null>(null);
  const [prizeWon, setPrizeWon] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [isAiConfigured, setIsAiConfigured] = useState(true);

  const currentQuestion = quizQuestions[currentQuestionIndex] ?? null;
  
  useEffect(() => {
    setIsAiConfigured(!!process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
  }, []);

  const resetLifelines = () => {
    setLifelines({ cards: true, audience: true, experts: true });
    setDisabledOptions([]);
  };

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
        setGameState('auth');
    } finally {
        setIsProcessing(false);
    }
  }, [toast, isAiConfigured, isProcessing]);

  const checkNicknameAvailability = async (nickname: string) => {
    if (!isSupabaseConfigured || !supabase) return true;
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('player_name')
        .eq('player_name', nickname)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return !data;
    } catch (error) {
      console.error("Error checking nickname:", error);
      toast({ title: "Erro ao verificar apelido", description: "Não foi possível verificar a disponibilidade do apelido. Tente novamente.", variant: "destructive" });
      return false;
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !isAiConfigured || !isFirebaseConfigured || !auth) return;
    setIsProcessing(true);

    try {
      if (authTab === 'signup') {
        if (!playerName.trim() || !email || !password) {
          toast({ title: "Todos os campos são obrigatórios para criar a conta.", variant: "destructive" });
          setIsProcessing(false);
          return;
        }

        const isAvailable = await checkNicknameAvailability(playerName);
        if (!isAvailable) {
          toast({ title: "Apelido Indisponível", description: "Este apelido já está em uso. Por favor, escolha outro.", variant: "destructive" });
          setIsProcessing(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: playerName });
        setPlayerName(playerName);
        toast({ title: "Conta criada com sucesso!", description: "Começando o jogo..." });
        await startGame();

      } else { // authTab === 'login'
        if (!email || !password) {
          toast({ title: "Email e senha são obrigatórios.", variant: "destructive" });
          setIsProcessing(false);
          return;
        }
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setPlayerName(userCredential.user.displayName || 'Jogador(a)');
        toast({ title: "Login realizado com sucesso!", description: "Bem-vindo(a) de volta!" });
        await startGame();
      }
    } catch (error: any) {
      console.error("Firebase auth error:", error);
      const errorCode = error.code;
      let friendlyMessage = "Ocorreu um erro. Verifique suas credenciais e a conexão com a internet.";
      if (errorCode === 'auth/email-already-in-use') {
        friendlyMessage = "Este e-mail já está em uso. Tente fazer login ou use outro e-mail.";
      } else if (errorCode === 'auth/weak-password') {
        friendlyMessage = "A senha é muito fraca. Use pelo menos 6 caracteres.";
      } else if (errorCode === 'auth/invalid-credential') {
        friendlyMessage = "Email ou senha incorretos.";
      } else if (errorCode === 'auth/api-key-not-valid') {
        friendlyMessage = "A chave de API do Firebase é inválida. Verifique o valor da variável NEXT_PUBLIC_FIREBASE_API_KEY no seu arquivo .env e reinicie o servidor.";
      } else if (errorCode === 'auth/operation-not-allowed' || errorCode === 'auth/configuration-not-found') {
        friendlyMessage = "Falha na configuração do Firebase. Verifique se as chaves em seu arquivo .env estão corretas e se o provedor de Email/Senha está ativo.";
      }
      toast({ title: "Erro na Autenticação", description: friendlyMessage, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleGoogleAuth = async () => {
    if (isProcessing || !isAiConfigured || !isFirebaseConfigured || !auth) return;
    setIsProcessing(true);
    try {
      const user = await handleGoogleSignIn();
      if (user) {
        setPlayerName(user.displayName || 'Jogador(a)');
        toast({ title: "Login realizado com sucesso!", description: `Bem-vindo(a) de volta, ${user.displayName}!` });
        await startGame();
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ title: "Erro no Login com Google", description: "Não foi possível fazer o login. Tente novamente.", variant: "destructive" });
      }
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
  };

  const saveScore = useCallback(async (score: number) => {
    if (!isSupabaseConfigured || !supabase || !auth?.currentUser || !auth.currentUser.displayName || score <= 0) return;
    
    try {
      const { error } = await supabase.rpc('upsert_player_score', {
        p_user_id: auth.currentUser.uid,
        p_player_name: auth.currentUser.displayName,
        p_score: score,
      });

      if (error) throw error;

    } catch (error: any) {
      console.error("Supabase save score error message:", error.message || error);
      let description = "Não foi possível registrar sua pontuação no ranking.";
      if (error.message.includes("violates row-level security policy")) {
        description = "Falha de permissão ao salvar. Verifique a configuração de RLS no Supabase.";
      } else if (error.message.includes("violates unique constraint")) {
        description = "Ocorreu um erro de apelido duplicado. Tente reiniciar o jogo.";
      }
      toast({ title: "Erro ao Salvar Pontuação", description, variant: "destructive" });
    }
  }, [toast]);
  

  const fetchLeaderboard = async () => {
    if (!isSupabaseConfigured || !supabase) {
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

  const advanceToNextQuestion = useCallback(() => {
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
  }, [currentQuestionIndex]);
  
  useEffect(() => {
    if (!hostResponse || (answerStatus !== 'correct' && answerStatus !== 'incorrect')) return;

    const timer = setTimeout(() => {
        if (answerStatus === 'correct') {
          advanceToNextQuestion();
        } else if (answerStatus === 'incorrect') {
            setGameState('game_over');
            setIsProcessing(false);
        }
    }, 3000);

    return () => clearTimeout(timer);
  }, [hostResponse, answerStatus, advanceToNextQuestion]);


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
      const res = await gameShowHost({ playerName: playerName || "Jogador(a)", question: currentQuestion.question, answer: answerKey, isCorrect: isCorrect, currentPrize: nextPrize, prizeOnFailure: prizeOnFailure });
      setHostResponse(res.response);
    } catch (error) {
      setHostResponse(isCorrect ? 'Resposta certa!' : 'Resposta errada.');
      // Keep processing on error, as the useEffect for answerStatus will handle the next step.
    }
  };

  const restartGame = () => {
    setGameState('auth');
    setAuthView('guest');
    setPlayerName('');
    setEmail('');
    setPassword('');
    setAuthTab('signup');
    setLeaderboard(null);
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
        <div className="grid grid-cols-1 lg:grid-cols-4 w-full gap-6 animate-fade-in">
          {/* Main Game Column */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="w-full text-center p-2 rounded-lg bg-black/30 border border-secondary/50">
                <p className="font-display text-xl tracking-wider">
                    <span className="text-white/70">Pergunta {currentQuestionIndex + 1}/{TOTAL_QUESTIONS}</span>
                </p>
            </div>
          
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
                    disabled={selectedAnswer !== null || isProcessing || isDisabled || answerStatus === 'incorrect'}
                    className={cn(
                      "flex items-center gap-4 p-3 md:p-4 rounded-lg border-2 text-base md:text-lg font-bold transition-all duration-300 transform hover:scale-[1.03] hover:brightness-125",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:brightness-100",
                      isDisabled && "opacity-30 bg-gray-700 !border-gray-600",
                      !selectedAnswer && `bg-gradient-to-br ${buttonStyle.gradient} ${buttonStyle.border}`,
                      (answerStatus === 'correct' && isSelected) && "bg-green-500 border-green-300 animate-pulse ring-4 ring-white",
                      (answerStatus === 'incorrect' && isSelected) && "bg-red-500 border-red-300 animate-pulse ring-4 ring-white",
                      (selectedAnswer && !isSelected && answerStatus !== 'unanswered') && "opacity-40"
                    )}
                  >
                    <span className={cn("flex items-center justify-center h-8 w-8 rounded-full font-black text-white text-glow-primary", `bg-gradient-to-br ${buttonStyle.gradient}`)}>{key}</span>
                    <span className="text-white text-left flex-1">{value}</span>
                  </button>
                );
              })}
            </div>
            
            {hostResponse && (
              <Card className="w-full text-center mt-4 animate-fade-in p-4 bg-black/50 border-primary">
                  <p className="text-xl font-bold text-glow-primary font-display">{hostResponse}</p>
              </Card>
            )}

            <Card className="mt-auto p-2 bg-card/80 border-2 border-secondary/50 rounded-xl">
                <div className="flex justify-between items-center gap-2">
                    {/* Lifelines on the left */}
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button onClick={handleUseExperts} disabled={!lifelines.experts || !!selectedAnswer || isProcessing} variant="outline" size="icon" className="border-secondary text-secondary hover:bg-secondary/20 hover:text-secondary disabled:opacity-40 size-12">
                              <GraduationCap className="w-6 h-6"/>
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Universitários</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={handleUseCards} disabled={!lifelines.cards || !!selectedAnswer || isProcessing} variant="outline" size="icon" className="border-accent text-accent hover:bg-accent/20 hover:text-accent disabled:opacity-40 size-12">
                              <Layers className="w-6 h-6"/>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Cartas (Remove 2)</TooltipContent>
                      </Tooltip>
                       <Tooltip>
                        <TooltipTrigger asChild>
                           <Button onClick={handleUseAudience} disabled={!lifelines.audience || !!selectedAnswer || isProcessing} variant="outline" size="icon" className="border-orange-400 text-orange-400 hover:bg-orange-400/20 hover:text-orange-400 disabled:opacity-40 size-12">
                              <Users className="w-6 h-6"/>
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>Plateia</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Give up button on the right */}
                    <div className="flex items-center gap-2">
                      <Button 
                          variant="destructive"
                          onClick={handleGiveUp} 
                          disabled={isProcessing || !!selectedAnswer}
                          className="bg-red-700/80 hover:bg-red-700 border-red-500 font-bold text-lg py-6 px-8 rounded-full shadow-lg"
                      >
                          <Trophy className="mr-2 h-5 w-5"/>
                          Parar
                      </Button>
                    </div>
                </div>
            </Card>
          </div>

          {/* Prize Ladder Column */}
          <div className="order-first lg:order-last lg:col-span-1 h-full">
            <PrizeLadder currentQuestionIndex={currentQuestionIndex} />
          </div>
        </div>
      );
  }
  
  const renderContent = () => {
    switch(gameState) {
      case 'auth':
        return (
          <div className="flex flex-col items-center justify-center text-center w-full max-w-lg p-4 gap-6 animate-fade-in">
            <Logo />

            {authView === 'guest' && (
              <div className="w-full max-w-sm flex flex-col gap-4">
                  <Button onClick={() => startGame()} size="lg" className="w-full font-bold text-xl h-16 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-transform box-glow-primary rounded-lg" disabled={isProcessing || !isAiConfigured}>
                      {isProcessing ? <Loader2 className="animate-spin" /> : "JOGAR COMO CONVIDADO"}
                  </Button>
                  <Button onClick={handleGoogleAuth} variant="outline" size="lg" className="w-full font-bold text-lg h-14 border-white/50 text-white hover:bg-white/20 hover:text-white rounded-lg" disabled={isProcessing || !isAiConfigured || !isFirebaseConfigured}>
                     <svg className="mr-2" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path><path d="M1 1h22v22H1z" fill="none"></path></svg>
                     ENTRAR COM GOOGLE
                  </Button>
                  <Button onClick={() => setAuthView('login')} variant="link" className="text-white/70 hover:text-primary">
                     ou entre com Email e Senha
                  </Button>
              </div>
            )}

            {authView === 'login' && (
               <Card className="w-full max-w-sm bg-card/80 border-primary/50 p-6">
                 {!isFirebaseConfigured && (
                      <Alert variant="destructive" className="mb-4 text-left">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Login/Cadastro Desabilitado</AlertTitle>
                          <AlertDescription>
                              As chaves do Firebase não foram configuradas. Por favor, adicione as variáveis `NEXT_PUBLIC_FIREBASE_*` ao seu arquivo <strong>.env</strong> e reinicie o servidor. Você pode continuar como convidado.
                          </AlertDescription>
                      </Alert>
                    )}
                 <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as any)} className="w-full">
                   <TabsList className="grid w-full grid-cols-2 bg-muted/80">
                     <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                     <TabsTrigger value="login">Login</TabsTrigger>
                   </TabsList>
                   <form onSubmit={handleAuthSubmit} className="mt-4">
                      <TabsContent value="signup" className="m-0 space-y-3">
                         <div className="space-y-1 text-left">
                            <Label htmlFor="nickname">Apelido</Label>
                            <Input id="nickname" placeholder="Seu nome no ranking" value={playerName} onChange={(e) => setPlayerName(e.target.value)} required />
                         </div>
                         <div className="space-y-1 text-left">
                            <Label htmlFor="email-signup">Email</Label>
                            <Input id="email-signup" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                         </div>
                         <div className="space-y-1 text-left">
                            <Label htmlFor="password-signup">Senha</Label>
                            <Input id="password-signup" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
                         </div>
                      </TabsContent>
                      <TabsContent value="login" className="m-0 space-y-3">
                          <div className="space-y-1 text-left">
                            <Label htmlFor="email-login">Email</Label>
                            <Input id="email-login" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                         </div>
                         <div className="space-y-1 text-left">
                            <Label htmlFor="password-login">Senha</Label>
                            <Input id="password-login" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
                         </div>
                      </TabsContent>
                      <Button type="submit" size="lg" className="w-full !mt-6 font-bold text-lg" disabled={isProcessing || !isAiConfigured || !isFirebaseConfigured}>
                          {isProcessing ? <Loader2 className="animate-spin" /> : (authTab === 'signup' ? 'Criar e Jogar' : 'Jogar')}
                      </Button>
                   </form>
                 </Tabs>
                  <Button variant="link" className="mt-4 text-sm text-white/70" onClick={() => setAuthView('guest')}>&larr; Voltar</Button>
               </Card>
            )}

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
              <Button variant="ghost" onClick={() => { setInfoDialog('ranking'); fetchLeaderboard(); }} className="text-white/70 hover:text-primary">
                  <BarChart2 className="mr-2"/>Ranking
              </Button>
              <Button variant="ghost" onClick={() => setInfoDialog('ajuda')} className="text-white/70 hover:text-primary">
                  <ScrollText className="mr-2"/>Regras
              </Button>
              <Button variant="ghost" onClick={() => setInfoDialog('creditos')} className="text-white/70 hover:text-primary">
                  <Sparkles className="mr-2"/>Créditos
              </Button>
              {auth?.currentUser && (
                <Button variant="ghost" onClick={handleLogout} className="text-red-500/70 hover:text-red-500">
                    <LogOut className="mr-2"/>Sair
                </Button>
              )}
            </div>
            
             {!isAiConfigured && (
                <Alert variant="destructive" className="mt-4 text-left">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Configuração da IA Incompleta</AlertTitle>
                    <AlertDescription>
                        A chave da API do Google está faltando no arquivo <strong>.env</strong>. O jogo não funcionará sem ela.
                    </AlertDescription>
                </Alert>
            )}
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
              ? <Trophy className="h-24 w-24 text-primary animate-pulse-slow" style={{ filter: 'drop-shadow(0 0 15px hsl(var(--primary)))' }}/>
              : <Crown className="h-24 w-24 text-white/50" />
            }
            <h1 className="font-display text-4xl md:text-6xl font-black mt-4 text-glow-primary">{isWinner ? "VOCÊ GANHOU!" : "FIM DE JOGO"}</h1>
            <p className="text-xl mt-4 text-white/80 max-w-xl my-8">
              {finalMessage}
            </p>
             <div className="flex gap-4 mt-4">
                <Button onClick={() => startGame()} size="lg" className="text-lg font-bold px-8 py-6 rounded-lg">
                  TENTAR NOVAMENTE
                </Button>
                <Button onClick={restartGame} variant="outline" size="lg" className="text-lg font-bold px-8 py-6 rounded-lg">
                  TELA INICIAL
                </Button>
             </div>
          </div>
        );
      case 'playing':
        return renderGameScreen();
    }
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-6xl mx-auto flex items-center justify-center">
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
              {infoDialog === 'ranking' && <><Trophy /> Ranking</>}
            </DialogTitle>
          </DialogHeader>
            <DialogDescription asChild>
              <div className="text-white/90 font-sans max-h-[60vh] overflow-y-auto pr-2">
                {infoDialog === 'ajuda' && (
                  <div className="space-y-4 pt-4">
                      <p>O objetivo é simples: responda a 16 perguntas de conhecimentos gerais para ganhar o prêmio máximo de R$ 1.000.000!</p>
                      <div>
                          <h3 className="font-bold text-primary mb-2">Ajudas Disponíveis (1 uso por jogo):</h3>
                          <ul className="space-y-1 list-disc list-inside">
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
                              <li>Firebase Authentication & Supabase</li>
                          </ul>
                      </div>
                  </div>
                )}
                 {infoDialog === 'ranking' && (
                   <div className="space-y-4 pt-4 text-left">
                     {isLeaderboardLoading ? (
                       <div className="flex justify-center items-center h-40">
                         <Loader2 className="w-10 h-10 animate-spin text-primary" />
                       </div>
                     ) : leaderboard && leaderboard.length > 0 ? (
                       <ol className="list-none space-y-3">
                         {leaderboard.map((entry, index) => (
                             <li key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                               <span className="font-semibold">{index + 1}. {entry.player_name}</span>
                               <span className="font-bold text-secondary">R$ {entry.score.toLocaleString('pt-BR')}</span>
                             </li>
                         ))}
                       </ol>
                     ) : (
                       <div className="text-center py-10">
                         <p className="text-white/70">O ranking está vazio ou não pôde ser carregado.</p>
                         {!isSupabaseConfigured && (
                             <Alert variant="destructive" className="mt-4 text-left">
                               <AlertTitle>Ranking Desabilitado</AlertTitle>
                               <AlertDescription>
                                 O ranking está desabilitado. Por favor, adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` ao seu arquivo <strong>.env</strong> e reinicie o servidor.
                               </AlertDescription>
                             </Alert>
                         )}
                       </div>
                     )}
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
