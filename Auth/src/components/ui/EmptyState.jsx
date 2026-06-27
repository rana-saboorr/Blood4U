import { Link } from 'react-router-dom';
import Button from '../Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div
      className="glass-panel rounded-3xl py-16 px-8 text-center max-w-lg mx-auto"
      role="status"
    >
      {Icon && (
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400">
          <Icon size={28} aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      )}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="inline-block mt-6">
          <Button>{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}
