
import PrimaryButton from "./primary-button";

interface PageHeaderProps {
  heading: string;
  buttonText: string;
  onButtonClick: () => void;
}

export default function PageHeader({ heading, buttonText, onButtonClick }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800">{heading}</h1>
      {/* <Button
        variant="contained"
        onClick={onButtonClick}
        className="bg-gradient-to-r from-red-500 to-blue-500 hover:scale-105 transition-all duration-300"
      >
        {buttonText}
      </Button> */}
      {buttonText && <PrimaryButton label={buttonText} onClick={onButtonClick} />}
      {/* <PrimaryButton label={buttonText} onClick={onButtonClick} /> */}
    </div>
  );
} 