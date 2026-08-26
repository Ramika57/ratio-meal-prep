import type { MealComponent } from "@/lib/types";

/**
 * Isometric tray render for menu cards.
 *
 * Built from CSS 3D transforms rather than a WebGL canvas: a twenty card grid
 * would otherwise need twenty GL contexts, and browsers cap out around sixteen.
 * The hero and the product section get the real three.js tray instead.
 */
export function TrayIso({
  components,
  className = "",
  lift = true,
}: {
  components: MealComponent[];
  className?: string;
  lift?: boolean;
}) {
  const [a, b, c] = components;

  const food = (component: MealComponent | undefined, style: React.CSSProperties) => {
    if (!component) return null;
    return (
      <div
        className="absolute rounded-sm"
        style={{
          ...style,
          background: `
            radial-gradient(ellipse 62% 54% at 32% 26%, rgba(255,255,255,0.34), transparent 62%),
            radial-gradient(ellipse 54% 44% at 74% 74%, rgba(0,0,0,0.26), transparent 64%),
            ${component.color}`,
          boxShadow:
            "inset 0 0 0 1px rgba(0,0,0,0.28), inset 0 5px 10px rgba(0,0,0,0.24), 0 1px 0 rgba(255,255,255,0.06)",
        }}
        aria-hidden
      />
    );
  };

  return (
    <div className={`group/tray relative ${className}`} style={{ perspective: "1000px" }}>
      <div
        className="relative mx-auto"
        style={{
          width: "82%",
          aspectRatio: "1.38",
          transformStyle: "preserve-3d",
          transform: "rotateX(57deg) rotateZ(-37deg)",
        }}
      >
        {/* Cast shadow on the bench */}
        <div
          className="absolute inset-[-6%] rounded-xl blur-xl"
          style={{ background: "rgba(0,0,0,0.55)", transform: "translateZ(-40px)" }}
          aria-hidden
        />

        {/* Tray underside, gives the walls visible thickness */}
        <div
          className="absolute inset-0 rounded-lg"
          style={{ background: "#08080a", transform: "translateZ(-16px)" }}
          aria-hidden
        />

        {/* Tray body */}
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: "linear-gradient(148deg, #2a2a30 0%, #17171b 46%, #101013 100%)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.09)",
          }}
          aria-hidden
        />

        {/* Compartments */}
        {food(a, { left: "5%", top: "7%", width: "44%", height: "86%" })}
        {food(b, { left: "52%", top: "7%", width: "43%", height: "40%" })}
        {food(c, { left: "52%", top: "53%", width: "43%", height: "40%" })}

        {/* Sealed film lid */}
        <div
          className={`absolute inset-[-1.5%] rounded-lg transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            lift ? "group-hover/tray:[transform:translateZ(62px)_rotate(-3deg)]" : ""
          }`}
          style={{
            transform: "translateZ(28px)",
            background:
              "linear-gradient(146deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.05) 38%, rgba(255,255,255,0.13) 100%)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)",
            backdropFilter: "blur(0.5px)",
          }}
          aria-hidden
        >
          {/* Printed macro label */}
          <div
            className="absolute rounded-[4px]"
            style={{ left: "7%", bottom: "8%", width: "34%", height: "13%", background: "#cdf546", opacity: 0.92 }}
          />
          <div
            className="absolute rounded-[4px]"
            style={{ left: "46%", bottom: "9%", width: "22%", height: "7%", background: "rgba(243,241,236,0.6)" }}
          />
        </div>
      </div>
    </div>
  );
}
