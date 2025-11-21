import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Trophy } from 'lucide-react';
import type { Achievement } from '@/lib/definitions';
import { iconMap } from '@/lib/icon-map';

interface AchievementsTableProps {
  data: Achievement[];
  onEdit: (achievement: Achievement) => void;
  onDelete: (id: string) => void;
}

export function AchievementsTable({ data, onEdit, onDelete }: AchievementsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Ícone</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>XP</TableHead>
            <TableHead>Gatilho</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Nenhuma conquista encontrada. Crie a primeira!
              </TableCell>
            </TableRow>
          ) : (
            data.map((achievement) => {
              const Icon = iconMap[achievement.icon] || Trophy;
              return (
                <TableRow key={achievement.id}>
                  <TableCell>
                    <div className="p-2 bg-muted rounded-md w-fit">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{achievement.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate" title={achievement.description}>
                    {achievement.description}
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-accent">+{achievement.xp} XP</span>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {achievement.trigger || 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(achievement)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(achievement.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
