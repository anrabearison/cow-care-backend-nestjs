import { ApiProperty } from '@nestjs/swagger';

export class SessionDto {
    @ApiProperty({ description: "ID unique de la session" })
    id: string;

    @ApiProperty({ description: "Date de création de la session" })
    createdAt: Date;

    @ApiProperty({ description: "Date de la dernière utilisation de la session" })
    lastUsedAt: Date;

    @ApiProperty({ description: "Date d'expiration de la session" })
    expiresAt: Date;

    @ApiProperty({ description: "Adresse IP de connexion", nullable: true })
    ipAddress: string | null;

    @ApiProperty({ description: "User-Agent brut du client", nullable: true })
    userAgent: string | null;

    @ApiProperty({ description: "Nom de l'appareil (ex: Mobile, Desktop)", nullable: true })
    deviceName: string | null;

    @ApiProperty({ description: "Navigateur web (ex: Chrome, Safari)", nullable: true })
    browser: string | null;

    @ApiProperty({ description: "Système d'exploitation (ex: Windows, iOS)", nullable: true })
    os: string | null;

    @ApiProperty({ description: "Vrai si c'est la session courante" })
    isCurrentSession: boolean;
}
