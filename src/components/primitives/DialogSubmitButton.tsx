export default function DialogSubmitButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: React.MouseEventHandler;
}) {
  return (
    <button
      type="submit"
      onClick={onClick}
      className="outline-none select-none cursor-pointer
        text-base rounded-md py-1.5 px-3
        focus:outline-none focus:ring-0 focus:ring-offset-0
        focus-visible:ring
        focus-visible:ring-blue-400 dark:focus-visible:ring-blue-600
        focus-visible:ring-opacity-75 focus-visible:ring-offset-2
        bg-blue-500 text-white
        hover:bg-blue-600 dark:hover:bg-blue-400
        border border-solid border-gray-300 dark:border-gray-600"
    >
      {children}
    </button>
  );
}
