'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableItemProps {
    children: React.ReactNode;
    onDelete?: () => void;
    onEdit?: () => void;
    className?: string;
}

export function SwipeableItem({ children, onDelete, onEdit, className }: SwipeableItemProps) {
    const x = useMotionValue(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const backgroundOpacityDelete = useTransform(x, [-100, -50], [1, 0]);
    const backgroundOpacityEdit = useTransform(x, [50, 100], [0, 1]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setIsDragging(false);
        if (info.offset.x < -100 && onDelete) {
            onDelete();
        } else if (info.offset.x > 100 && onEdit) {
            onEdit();
        }
    };

    return (
        <div className={cn("relative overflow-hidden rounded-xl mb-4", className)} ref={containerRef}>
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                <motion.div
                    style={{ opacity: backgroundOpacityEdit }}
                    className="flex items-center gap-2 text-blue-500 font-semibold"
                >
                    <Edit className="h-5 w-5" /> Editar
                </motion.div>
                <motion.div
                    style={{ opacity: backgroundOpacityDelete }}
                    className="flex items-center gap-2 text-red-500 font-semibold"
                >
                    Excluir <Trash2 className="h-5 w-5" />
                </motion.div>
            </div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                style={{ x, touchAction: 'pan-y' }}
                className="relative bg-card z-10"
                whileTap={{ cursor: 'grabbing' }}
            >
                {children}
            </motion.div>
        </div>
    );
}
