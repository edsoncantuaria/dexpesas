'use client';

import { motion } from 'framer-motion';
import { Bot, Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AIInsightCardProps = {
    title: string;
    content: string;
    type?: 'insight' | 'opportunity' | 'warning';
    className?: string;
};

export function AIInsightCard({ title, content, type = 'insight', className }: AIInsightCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getGradient = () => {
        switch (type) {
            case 'opportunity':
                return 'from-emerald-500/10 to-green-500/5 border-emerald-500/20';
            case 'warning':
                return 'from-amber-500/10 to-orange-500/5 border-amber-500/20';
            default:
                return 'from-primary/10 to-primary/5 border-primary/20';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'opportunity':
                return <Sparkles className="h-5 w-5 text-emerald-500" />;
            case 'warning':
                return <Bot className="h-5 w-5 text-amber-500" />;
            default:
                return <Bot className="h-5 w-5 text-primary" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm',
                'bg-gradient-to-br',
                getGradient(),
                className
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-background/50 p-2 shadow-sm ring-1 ring-inset ring-foreground/5">
                        {getIcon()}
                    </div>
                    <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleCopy}
                >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>

            <div className="mt-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {content}
            </div>

            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl" />
        </motion.div>
    );
}
