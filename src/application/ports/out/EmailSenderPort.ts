export interface EmailSenderPort {
  sendVerification(input: { to: string; verificationUrl: string }): Promise<void>;
}
