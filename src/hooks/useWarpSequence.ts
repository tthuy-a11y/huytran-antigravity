'use client';

import { useRouter } from 'next/navigation';
import { useFleetStore } from '@/store/useFleetStore';
import { audioEngine } from '@/lib/AudioEngine';

export const useWarpSequence = () => {
  const router = useRouter();
  const { setPhase, setCurrentShip } = useFleetStore();

  const triggerWarpJump = (shipId: string) => {
    audioEngine.init();
    setCurrentShip(shipId);
    setPhase('power-up');
    audioEngine.playPowerUp();

    // Power-up → Warping (1.6s)
    setTimeout(() => {
      setPhase('warping');
      audioEngine.playSonicBoom();

      // Warping → router.push + flash (0.95s)
      setTimeout(() => {
        router.push('/creative');

        // Arrival phase sau khi /creative load xong (0.95s)
        setTimeout(() => {
          setPhase('arrival');
          audioEngine.playArrival();

          // Reset sau khi ship dock hoàn tất (2.45s)
          setTimeout(() => {
            setPhase('idle');
            setCurrentShip(null);
          }, 2450);
        }, 960);
      }, 960);
    }, 1620);
  };

  return { triggerWarpJump };
};
