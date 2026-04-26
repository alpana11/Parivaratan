interface SpinnerProps {
  fullScreen?: boolean;
  message?: string;
}

const Spinner = ({ fullScreen = true, message = 'Loading...' }: SpinnerProps) => (
  <div className={`flex flex-col items-center justify-center gap-3 ${fullScreen ? 'min-h-screen' : 'h-64'}`}>
    <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

export default Spinner;
