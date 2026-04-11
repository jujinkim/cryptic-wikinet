export default function FullScreenLoadingOverlay(props: { show: boolean }) {
  if (!props.show) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 backdrop-blur-[2px]"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl dark:bg-zinc-950/95">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white" />
      </div>
    </div>
  );
}
