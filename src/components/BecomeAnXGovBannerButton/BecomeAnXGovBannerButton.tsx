import { AlgoShapeIcon10 } from "../icons/AlgoShapeIcon10";

export interface BecomeAnXGovBannerButtonProps {
  rings?: number;
  amplifier?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export function BecomeAnXGovBannerButton({
  rings = 10,
  amplifier = 60,
  onClick,
  disabled = false,
}: BecomeAnXGovBannerButtonProps) {
  return (
    <button
      type="button"
      className="group relative w-full h-40 md:h-60 flex items-center justify-center bg-algo-blue dark:bg-algo-teal dark:text-algo-black hover:bg-white dark:hover:bg-algo-black dark:hover:text-white rounded-lg overflow-hidden transition duration-300"
      onClick={onClick}
      disabled={disabled}
    >
      <div className="absolute w-full h-full animate-mass-scale">
        <div className="relative w-full h-full flex items-center justify-center">
          {Array.from({ length: rings }).map((_, i) => (
            <AlgoShapeIcon10
              key={i}
              style={{
                height: `${i * amplifier + 60}rem`,
                width: `${i * amplifier + 60}rem`,
                translate: `-${i * 10}rem -${i + 10}rem`,
              }}
              className="absolute stroke-white group-hover:stroke-algo-blue dark:stroke-algo-black dark:group-hover:stroke-algo-teal stroke-[2px]"
            />
          ))}
        </div>
      </div>

      <h1 className="text-3xl md:text-8xl font-extrabold uppercase text-white group-hover:text-algo-blue dark:text-algo-black dark:group-hover:text-algo-teal">
        Become an XGov
      </h1>
    </button>
  );
}
