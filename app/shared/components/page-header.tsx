import PrimaryButton from './primary-button';
import SecondaryButton from './secondary-button';

interface PageHeaderProps {
  heading: string;
  buttonText: string;
  onButtonClick: () => void;
  buttonVariant?: 'primary' | 'secondary';
}

export default function PageHeader({
  heading,
  buttonText,
  onButtonClick,
  buttonVariant = 'primary',
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-800">{heading}</h1>
      {/* <Button
        variant="contained"
        onClick={onButtonClick}
        className="bg-gradient-to-r from-red-500 to-blue-500 hover:scale-105 transition-all duration-300"
      >
        {buttonText}
      </Button> */}
      {buttonText && buttonVariant === 'primary' && (
        <PrimaryButton label={buttonText} onClick={onButtonClick} />
      )}
      {buttonText && buttonVariant === 'secondary' && (
        <SecondaryButton label={buttonText} onClick={onButtonClick} />
      )}
      {/* <PrimaryButton label={buttonText} onClick={onButtonClick} /> */}
    </div>
  );
}
