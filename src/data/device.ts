import type { DeviceInfo, Telemetry } from '@/types/telemetry';

/**
 * Reference build facts, read off the real firmware image:
 *   - Linker scripts (STM32F411CEUX_RAM.ld / _FLASH.ld): 128K RAM, 512K FLASH
 *   - model_metadata.h: EI_CLASSIFIER_TFLITE_LARGEST_ARENA_SIZE 126016,
 *     EI_CLASSIFIER_THRESHOLD 0.6, 96x96 input, int8 in/out, EON-compiled
 *   - model_variables.h: project 1111905, 3 labels, squashed resize, RGB
 */
export const DEVICE_INFO: DeviceInfo = {
  board: 'STM32F411CEUx',
  mcu: 'STM32F411CEU6 · Cortex-M4F @ 100 MHz · FPU',
  flashBytes: 512 * 1024,
  ramBytes: 128 * 1024,
  sdk: 'Edge Impulse SDK for Embedded (inferencing-engine-cpp)',
  runtime: 'CMSIS-NN / TFLite Micro · EON-compiled int8',
  firmware: 'cropguard-fw · project 1111905 · deploy v2',
  inputShape: '96 × 96 × RGB → int8',
  arenaBytes: 126_016,
  threshold: 0.6,
  projectName: 'Mani_2026-project-1',
};

export const BASE_TELEMETRY: Telemetry = {
  temperatureC: 24.6,
  humidityPct: 74,
  leafWetnessPct: 38,
  i2c: [
    { address: '0x40', device: 'SHT31-AD1B', ok: true },
    { address: '0x44', device: 'SHT31-AD2B', ok: true },
    { address: '0x48', device: 'ADS1118 AIN0', ok: true },
    { address: '0x76', device: 'BMP390', ok: true },
  ],
  heapUsedBytes: 21_840,
  heapCapacityBytes: 41_216,
  cpuLoadPct: 34,
  clockHz: 100_000_000,
  uptimeS: 3_827,
  frameRate: 10,
};