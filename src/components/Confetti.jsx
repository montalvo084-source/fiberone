import confetti from 'canvas-confetti';

const GREEN_PALETTE = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#065f46', '#d1fae5'];
const MULTI_PALETTE = ['#10b981', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#a78bfa', '#fb923c'];

export function useConfetti() {
  function triggerLog() {
    confetti({
      particleCount: 40,
      spread: 55,
      origin: { y: 0.7 },
      colors: GREEN_PALETTE,
      scalar: 0.9,
    });
  }

  function triggerGoal() {
    const fire = (opts) => confetti({ colors: MULTI_PALETTE, ...opts });

    fire({ particleCount: 80, spread: 100, origin: { y: 0.6 } });
    setTimeout(() => fire({ particleCount: 60, spread: 80, origin: { x: 0.2, y: 0.6 } }), 150);
    setTimeout(() => fire({ particleCount: 60, spread: 80, origin: { x: 0.8, y: 0.6 } }), 300);
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 160,
        origin: { y: 0.4 },
        colors: MULTI_PALETTE,
        startVelocity: 45,
      });
    }, 500);
  }

  return { triggerLog, triggerGoal };
}
