import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    Logger,
} from '@nestjs/common';
import { Passport } from './entities/passport.entity';
import { PassportCattleSnapshot } from './entities/passport-cattle-snapshot.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfMakeService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PdfMakeService.name);
    private browser: puppeteer.Browser | null = null;
    private compiledTemplate: HandlebarsTemplateDelegate | null = null;

    constructor() {}

    // ─── Lifecycle ──────────────────────────────────────────────────────────

    async onModuleInit(): Promise<void> {
        // Lance une seule instance Chromium partagée pour toute la durée de vie du module
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });
        this.logger.log('Chromium browser pool initialized');

        // Compile le template Handlebars une seule fois
        const templatePathSrc = path.join(process.cwd(), 'src', 'modules', 'farm', 'passport', 'templates', 'passport-template.html');
        const templatePathDist = path.join(__dirname, 'templates', 'passport-template.html');
        const templatePath = fs.existsSync(templatePathDist) ? templatePathDist : templatePathSrc;
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        this.compiledTemplate = Handlebars.compile(templateSource);
        this.logger.log('Handlebars template compiled');
    }

    async onModuleDestroy(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.logger.log('Chromium browser pool closed');
        }
    }

    // ─── Génération PDF ──────────────────────────────────────────────────────

    async generatePassportPdf(
        passport: Passport,
        snapshots: PassportCattleSnapshot[],
        qrCodeDataUrl: string,
    ): Promise<Buffer> {

        const html = this.renderTemplate(passport, snapshots, qrCodeDataUrl);

        // Réutilise une page du pool Chromium existant (ne relance pas le navigateur)
        const page = await this.browser!.newPage();
        try {
            await page.setContent(html, { waitUntil: 'domcontentloaded' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px',
                },
                printBackground: true,
            });

            return Buffer.from(pdfBuffer);
        } finally {
            // Ferme seulement la page, pas le navigateur
            await page.close();
        }
    }

    // ─── Rendu template ──────────────────────────────────────────────────────

    public renderHtml(
        passport: Passport,
        snapshots: PassportCattleSnapshot[],
        qrCodeDataUrl: string,
    ): string {
        return this.renderTemplate(passport, snapshots, qrCodeDataUrl);
    }

    private renderTemplate(
        passport: Passport,
        snapshots: PassportCattleSnapshot[],
        qrCodeDataUrl: string,
    ): string {
        const formatDate = (d: Date | string | undefined): string => {
            if (!d) return '—';
            return new Date(d).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        };

        const cattleList = snapshots.map((snapshot, index) => ({
            index: index + 1,
            nCarnet: snapshot.nCarnet || '—',
            characterName: snapshot.characterName || '—',
            brand: snapshot.brand || '—',
        }));

        // Handlebars échappe automatiquement les valeurs {{...}} — protection XSS intégrée
        const templateData = {
            passportNumber: passport.passportNumber,
            issueDate: formatDate(passport.issueDate),
            location: passport.location,
            district: passport.district,
            applicantName: passport.applicantName,
            cinNumber: passport.cinNumber,
            cinIssueDate: formatDate(passport.cinIssueDate),
            cinIssueLocation: passport.cinIssueLocation,
            residenceCommune: passport.residenceCommuneLegacy,
            village: passport.villageLegacy,
            commune: passport.communeLegacy,
            residenceDistrict: passport.residenceDistrictLegacy,
            region: passport.regionLegacy,
            purchaseCommune: passport.purchaseCommune,
            verificationDate: formatDate(passport.verificationDate),
            arreteDate: formatDate(passport.arreteDate),
            totalCattle: passport.totalCattle,
            generatedAt: formatDate(new Date()),
            // Le QR code est en base64 Data URL — utilisé dans <img src="...">
            // On utilise triple-accolade {{{...}}} pour injecter le Data URL sans échappement HTML
            qrCodeDataUrl,
            cattleList,
        };

        // Note : le template utilise {{{qrCodeDataUrl}}} pour le Data URL de l'image
        // Toutes les autres valeurs utilisent {{...}} avec échappement automatique
        return this.compiledTemplate!(templateData);
    }
}
