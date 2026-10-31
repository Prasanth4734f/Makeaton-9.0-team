import { InboxIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon = InboxIcon,
  title = 'Nothing here yet',
  description = '',
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-2xl bg-slate-100 p-5 mb-4">
        <Icon className="h-10 w-10 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}
