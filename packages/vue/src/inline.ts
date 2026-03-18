import { defineComponent } from 'vue';
import { getDeviceProfile, type Tier } from '@adaptive-bundle/core';

function createTierComponent(targetTier: Tier) {
  return defineComponent({
    name: `Adaptive${targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}`,
    setup(_, { slots }) {
      const profile = getDeviceProfile();
      return () => {
        if (profile.tier !== targetTier) return null;
        return slots.default ? slots.default() : null;
      };
    },
  });
}

export const AdaptiveHigh = createTierComponent('high');
export const AdaptiveLow = createTierComponent('low');
export const AdaptiveMedium = createTierComponent('medium');
