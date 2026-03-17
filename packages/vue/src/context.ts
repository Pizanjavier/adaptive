import { defineComponent, provide, type InjectionKey } from 'vue';
import { getDeviceProfile, type DeviceProfile } from '@adaptive/core';

export const ADAPTIVE_KEY: InjectionKey<DeviceProfile> = Symbol('adaptive');

export const AdaptiveProvider = defineComponent({
  name: 'AdaptiveProvider',
  setup(_, { slots }) {
    const profile = getDeviceProfile();
    provide(ADAPTIVE_KEY, profile);
    return () => (slots.default ? slots.default() : null);
  },
});
