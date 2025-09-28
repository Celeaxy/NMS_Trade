import { ref } from 'vue';

type FormResolver<T> = (result: T | null) => void;

export function useFormDialog<T = any>(defaultData: T) {
  const dialog = ref(false);
  const formData = ref<T>(defaultData);

  const title = ref<string | undefined>(undefined);

  let resolver: FormResolver<T> | null = null;

  function open(data?: T, titleText?: string): Promise<T | null> {
    formData.value = data ?? defaultData;
    dialog.value = true;
    title.value = titleText;
    return new Promise<T | null>((resolve) => {
      resolver = resolve;
    });
  }

  function submit() {
    dialog.value = false;
    resolver?.(formData.value);
    resolver = null;
  }

  function cancel() {
    dialog.value = false;
    resolver?.(null);
    resolver = null;
  }

  return {
    dialog,
    formData,
    title,
    open,
    submit,
    cancel,
  };
}
