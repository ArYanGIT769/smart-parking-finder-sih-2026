export interface ToastMsg {
  id: string;
  text: string;
  kind: 'entry' | 'exit' | 'ev' | 'pwd' | 'booking' | 'cancel' | 'info';
}
