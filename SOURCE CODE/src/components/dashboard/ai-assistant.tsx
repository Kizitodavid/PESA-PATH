'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiAssistantMessages as initialMessages } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { aiFinancialAdvice } from '@/ai/flows/ai-financial-advice';

type Message = {
  id: number;
  sender: 'user' | 'ai';
  text: string;
};

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useUser();
  const firestore = useFirestore();
  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userData } = useDoc(userDocRef);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (!userData) {
        throw new Error('User data not available. Please complete onboarding.');
      }
      
      const response = await aiFinancialAdvice({
        query: userMessage.text,
        userData: {
            age: userData.age || 25, // Fallback age
            income: userData.income || 50000, // Fallback income
            savingPlan: userData.savingPlan || 'monthly',
            totalSavings: userData.totalSavings || 0,
        }
      });
      
      const aiResponse: Message = {
        id: messages.length + 2,
        sender: 'ai',
        text: response.advice,
      };
      setMessages((prev) => [...prev, aiResponse]);

    } catch (error: any) {
       const aiErrorResponse: Message = {
        id: messages.length + 2,
        sender: 'ai',
        text: error.message || "I'm sorry, I couldn't process your request right now. Please try again later.",
      };
      setMessages((prev) => [...prev, aiErrorResponse]);
      console.error("AI financial advice error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          AI Financial Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-3',
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.sender === 'ai' && (
                  <Avatar className="h-8 w-8">
                     <div className="h-full w-full flex items-center justify-center bg-primary rounded-full">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                     </div>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs rounded-lg p-3 text-sm',
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  )}
                >
                  {message.text}
                </div>
                 {message.sender === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <div className="h-full w-full flex items-center justify-center bg-primary rounded-full">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                </Avatar>
                <div className="max-w-xs rounded-lg p-3 text-sm bg-secondary flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a financial question..."
            disabled={isLoading || !user}
          />
          <Button type="submit" size="icon" disabled={isLoading || !user}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
