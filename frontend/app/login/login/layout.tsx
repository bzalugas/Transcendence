import { FallingPattern } from "@/components/ui/falling-pattern";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <FallingPattern
          color="var(--primary)"
          duration={150}
          blurIntensity="1rem"
          density={1.5}

        />
      </div>
      <div className="relative z-10 h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
