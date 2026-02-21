export class ConfirmStore {
    isOpen = $state(false);
    message = $state('');
    resolve: ((value: boolean) => void) | null = null;

    confirm(message: string): Promise<boolean> {
        this.message = message;
        this.isOpen = true;
        return new Promise((res) => {
            this.resolve = res;
        });
    }

    handleConfirm() {
        if (this.resolve) {
            this.resolve(true);
            this.resolve = null;
        }
        this.isOpen = false;
    }

    handleCancel() {
        if (this.resolve) {
            this.resolve(false);
            this.resolve = null;
        }
        this.isOpen = false;
    }
}

export const confirmStore = new ConfirmStore();
