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
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // STARTTLS, pas SSL direct
        auth: {
            user: gmailUser,
            pass: gmailAppPassword,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
    });
}

  private loadTemplate(templateName: string, variables: Record<string, string>): string {
    // Templates HTML inline pour éviter les problèmes de copie de fichiers
    const templates: Record<string, string> = {
      invitation: `
        <p>Bonjour,</p>
        <p>Vous avez été invité·e à rejoindre l'application Ombiko.</p>
        <p>Cliquez sur le lien ci-dessous pour accepter l'invitation :</p>
        <p><a href="{{invitationLink}}">Accepter l'invitation</a></p>
        <p>Ce lien expirera dans 7 jours.</p>
        <p>Si vous n'avez pas demandé cette invitation, ignorez ce message.</p>
      `,
      'user-creation': `
        <p>Bonjour,</p>
        <p>Votre compte Ombiko a été créé avec succès.</p>
        <p><strong>Vos identifiants de connexion :</strong></p>
        <p>Email : {{email}}</p>
        <p>Mot de passe : {{password}}</p>
        <p><a href="{{loginLink}}">Se connecter à Ombiko</a></p>
        <p>Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe après votre première connexion.</p>
        <p>Si vous n'avez pas demandé la création de ce compte, contactez l'administrateur.</p>
      `,
      welcome: `
        <p>Bonjour,</p>
        <p>Bienvenue sur Ombiko !</p>
        <p>Votre compte a été créé avec succès via Google Authentification.</p>
        <p>Vous pouvez maintenant vous connecter à l'application en utilisant votre compte Google.</p>
        <p><a href="{{loginLink}}">Se connecter à Ombiko</a></p>
        <p>Nous sommes ravis de vous accueillir parmi nous !</p>
      `,
    };
    
    let html = templates[templateName] || '';
    
    // Replace variables in template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, variables[key]);
    });
    
    return html;
  }

  async sendInvitationEmail(to: string, token: string, opts?: { subject?: string; from?: string; frontendUrl?: string }) {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const frontUrl = opts?.frontendUrl ?? this.configService.get<string>('FRONT_OFFICE_URL') ?? 'http://localhost:8085';

    const from = opts?.from ?? gmailUser;
    const subject = opts?.subject ?? 'Invitation pour rejoindre Ombiko';
    const invitationLink = `${frontUrl.replace(/\/+$/, '')}/invitation?token=${encodeURIComponent(token)}`;

    const html = this.loadTemplate('invitation', { invitationLink });

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

  async sendUserCreationEmail(to: string, password: string, opts?: { subject?: string; from?: string; frontendUrl?: string }) {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const frontUrl = opts?.frontendUrl ?? this.configService.get<string>('FRONT_OFFICE_URL') ?? 'http://localhost:8085';

    const from = opts?.from ?? gmailUser;
    const subject = opts?.subject ?? 'Votre compte Ombiko a été créé';
    const loginLink = `${frontUrl.replace(/\/+$/, '')}/login`;

    const html = this.loadTemplate('user-creation', { email: to, password, loginLink });

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      this.logger.log(`User creation email sent to ${to}`);
    } catch (err: any) {
      this.logger.error('Failed to send user creation email', err?.message ?? err);
      throw new BadRequestException('Failed to send user creation email');
    }
  }

  async sendWelcomeEmail(to: string, opts?: { subject?: string; from?: string; frontendUrl?: string }) {
    const gmailUser = this.configService.get<string>('GMAIL_USER');
    const frontUrl = opts?.frontendUrl ?? this.configService.get<string>('FRONT_OFFICE_URL') ?? 'http://localhost:8085';

    const from = opts?.from ?? gmailUser;
    const subject = opts?.subject ?? 'Bienvenue sur Ombiko';
    const loginLink = `${frontUrl.replace(/\/+$/, '')}/login`;

    const html = this.loadTemplate('welcome', { loginLink });

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      this.logger.log(`Welcome email sent to ${to}`);
    } catch (err: any) {
      this.logger.error('Failed to send welcome email', err?.message ?? err);
      throw new BadRequestException('Failed to send welcome email');
    }
  }
}
