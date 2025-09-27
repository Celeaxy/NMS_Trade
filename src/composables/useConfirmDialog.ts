import { ref } from 'vue';

type ConfirmResolver = (result: boolean) => void;

export function useConfirmDialog() {
  const visible = ref(false);
  const message = ref('');
  const title = ref<string | undefined>(undefined);
  let resolver: ConfirmResolver | null = null;

  function confirm(msg: string, ttl?: string): Promise<boolean> {
    message.value = msg;
    title.value = ttl;
    visible.value = true;
    return new Promise<boolean>((resolve) => {
      resolver = resolve;
    });
  }

  function resolve(result: boolean): void {
    visible.value = false;
    resolver?.(result);
    resolver = null;
  }

  return {
    visible,
    message,
    title,
    confirm,
    resolve,
  };
}
