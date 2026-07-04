import { Injectable, OnModuleInit } from '@nestjs/common';
import { Passport } from './entities/passport.entity';
import { PassportCattleSnapshot } from './entities/passport-cattle-snapshot.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
const pdfMake = require('pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');

@Injectable()
export class PdfMakeService implements OnModuleInit {
    constructor(
        @InjectRepository(PassportCattleSnapshot)
        private readonly snapshotRepository: Repository<PassportCattleSnapshot>,
    ) {}

    onModuleInit() {
        if (pdfMake && pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
            pdfMake.vfs = pdfFonts.pdfMake.vfs;
        }
    }

    async generatePassportPdf(passport: Passport): Promise<Buffer> {
        const snapshots = await this.snapshotRepository.find({
            where: { passportId: passport.id },
        });

        const docDefinition = {
            content: [
                // Header
                {
                    text: 'RÉPUBLIQUE DE MADAGASCAR',
                    style: 'header',
                    alignment: 'center',
                },
                {
                    text: 'PASSEPORT DE TRANSFERT DE BÉTAIL',
                    style: 'subheader',
                    alignment: 'center',
                    margin: [0, 10, 0, 20],
                },
                {
                    canvas: [
                        { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2 },
                    ],
                    margin: [0, 0, 0, 20],
                },

                // Passport Number
                {
                    columns: [
                        {
                            text: 'Numéro de Passeport:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.passportNumber,
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },

                // Emission Information
                {
                    text: 'INFORMATIONS D\'ÉMISSION',
                    style: 'section',
                    margin: [0, 20, 0, 10],
                },
                {
                    columns: [
                        {
                            text: 'Lieu d\'émission:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.location,
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },
                {
                    columns: [
                        {
                            text: 'Date d\'émission:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: new Date(passport.issueDate).toLocaleDateString('fr-FR'),
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },
                {
                    columns: [
                        {
                            text: 'Arrondissement:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.district,
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },

                // Applicant Information
                {
                    text: 'INFORMATIONS DU DEMANDEUR',
                    style: 'section',
                    margin: [0, 20, 0, 10],
                },
                {
                    columns: [
                        {
                            text: 'Nom du demandeur:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.applicantName || 'N/A',
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },
                {
                    columns: [
                        {
                            text: 'Numéro CIN:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.cinNumber || 'N/A',
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },
                {
                    columns: [
                        {
                            text: 'Date CIN:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.cinIssueDate ? new Date(passport.cinIssueDate).toLocaleDateString('fr-FR') : 'N/A',
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },
                {
                    columns: [
                        {
                            text: 'Lieu CIN:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.cinIssueLocation || 'N/A',
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },

                // Residence Information
                {
                    text: 'INFORMATIONS DE RÉSIDENCE',
                    style: 'section',
                    margin: [0, 20, 0, 10],
                },
                {
                    columns: [
                        {
                            text: 'Commune de résidence:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.residenceCommuneLegacy || 'N/A',
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },
                {
                    columns: [
                        {
                            text: 'Village:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.villageLegacy || 'N/A',
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },
                {
                    columns: [
                        {
                            text: 'Kaominina:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.communeLegacy || 'N/A',
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },
                {
                    columns: [
                        {
                            text: 'Distrika:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.residenceDistrictLegacy || 'N/A',
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },
                {
                    columns: [
                        {
                            text: 'Faritra:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.regionLegacy || 'N/A',
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },

                // Transfer Information
                {
                    text: 'INFORMATIONS DE TRANSFERT',
                    style: 'section',
                    margin: [0, 20, 0, 10],
                },
                {
                    columns: [
                        {
                            text: 'Commune du lieu d\'achat:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.purchaseCommune,
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },
                {
                    columns: [
                        {
                            text: 'Nombre total de bœufs:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: passport.totalCattle.toString(),
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },

                // Verification Information
                {
                    text: 'INFORMATIONS DE VÉRIFICATION',
                    style: 'section',
                    margin: [0, 20, 0, 10],
                },
                {
                    columns: [
                        {
                            text: 'Date de vérification:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: new Date(passport.verificationDate).toLocaleDateString('fr-FR'),
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },
                {
                    columns: [
                        {
                            text: 'Date de l\'arrêté:',
                            style: 'label',
                            width: 200,
                        },
                        {
                            text: new Date(passport.arreteDate).toLocaleDateString('fr-FR'),
                            style: 'value',
                            width: '*',
                        },
                    ],
                    margin: [0, 5, 0, 5],
                },

                // Cattle List
                {
                    text: 'LISTE DES BŒUFS',
                    style: 'section',
                    margin: [0, 20, 0, 10],
                },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', '*', '*'],
                        body: [
                            [
                                { text: 'N°', style: 'tableHeader' },
                                { text: 'N° Carnet', style: 'tableHeader' },
                                { text: 'Caractère', style: 'tableHeader' },
                                { text: 'Marque', style: 'tableHeader' },
                            ],
                            ...snapshots.map((snapshot, index) => [
                                { text: (index + 1).toString(), style: 'tableCell' },
                                { text: snapshot.nCarnet, style: 'tableCell' },
                                { text: snapshot.characterName, style: 'tableCell' },
                                { text: snapshot.brand || 'N/A', style: 'tableCell' },
                            ]),
                        ],
                    },
                    layout: 'lightHorizontalLines',
                    margin: [0, 10, 0, 20],
                },

                // Footer
                {
                    text: 'Document officiel - À conserver',
                    style: 'footer',
                    alignment: 'center',
                    margin: [0, 30, 0, 0],
                },
            ],
            styles: {
                header: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 5],
                },
                subheader: {
                    fontSize: 14,
                    bold: true,
                    margin: [0, 0, 0, 10],
                },
                section: {
                    fontSize: 12,
                    bold: true,
                    margin: [0, 15, 0, 5],
                    decoration: 'underline',
                },
                label: {
                    fontSize: 10,
                    bold: true,
                },
                value: {
                    fontSize: 10,
                },
                tableHeader: {
                    fontSize: 10,
                    bold: true,
                    fillColor: '#f0f0f0',
                },
                tableCell: {
                    fontSize: 10,
                },
                footer: {
                    fontSize: 9,
                    italics: true,
                    color: '#666',
                },
            },
            pageSize: 'A4',
            pageMargins: [40, 60, 40, 60],
        };

        return new Promise((resolve, reject) => {
            try {
                const pdfDoc = pdfMake.createPdf(docDefinition);
                pdfDoc.getBuffer((buffer: Buffer) => {
                    resolve(buffer);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}
