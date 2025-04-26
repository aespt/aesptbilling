export default function FullSpinner() {
  return (
    <div className="fixed left-0 top-0 z-50 flex h-screen w-full items-center justify-center bg-black/10">
      <div className="size-12 animate-spin rounded-full border-4 border-b-red-500 border-l-blue-300 border-r-red-300 border-t-blue-500" />
    </div>
  );
}
