import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const gmailAppPassword = this.configService.get<string>('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailAppPassword) {
      this.logger.error('GMAIL_USER or GMAIL_APP_PASSWORD is not configured');
      throw new BadRequestException('Email service not configured');
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });
  }

  async sendInvitationEmail(to: string, token: string, opts?: { subject?: string; from?: string; frontendUrl?: string }) {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const frontUrl = opts?.frontendUrl ?? this.configService.get<string>('FRONT_OFFICE_URL') ?? 'http://localhost:8085';

    const from = opts?.from ?? gmailUser;
    const subject = opts?.subject ?? 'Invitation pour rejoindre Ombiko';
    const invitationLink = `${frontUrl.replace(/\/+$/, '')}/invitation?token=${encodeURIComponent(token)}`;

    const html = `
      <p>Bonjour,</p>
      <p>Vous avez été invité·e à rejoindre l'application Ombiko.</p>
      <p>Cliquez sur le lien ci-dessous pour accepter l'invitation :</p>
      <p><a href="${invitationLink}">Accepter l'invitation</a></p>
      <p>Ce lien expirera dans 7 jours.</p>
      <p>Si vous n'avez pas demandé cette invitation, ignorez ce message.</p>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      this.logger.log(`Invitation email sent to ${to}`);
    } catch (err: any) {
      this.logger.error('Failed to send invitation email', err?.message ?? err);
      throw new BadRequestException('Failed to send invitation email');
    }
  }
}
