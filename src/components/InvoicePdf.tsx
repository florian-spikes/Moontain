import React from 'react';
import {
    Document, Page, Text, View, Image,
    StyleSheet, Font,
} from '@react-pdf/renderer';

// Register fonts — Space Mono from local files, fallback to system for Horizon
Font.register({
    family: 'SpaceMono',
    fonts: [
        { src: '/fonts/SpaceMono-Bold.ttf', fontWeight: 'bold' },
    ],
});

// Use Helvetica as Horizon approximation (built-in, bold geometric sans-serif)
// If user provides Horizon.otf, we can register it here

Font.register({
    family: 'PPMori',
    fonts: [
        { src: '/fonts/PPMori-Regular.otf' },
    ],
});

// Disable hyphenation
Font.registerHyphenationCallback((word) => [word]);

const BG = '#F8F0E8';
const BLACK = '#000000';
const GREY = '#999999';
const WHITE = '#FFFFFF';
const MM = 2.835; // 1mm ≈ 2.835pt

const COMPANY = {
    name: 'MOONTAIN.STUDIO',
    phone: '06.13.82.82.48',
    email: 'projet@moontain.studio',
    address: 'Paris, France',
    iban: 'FR76 2823 3000 0167 5198 8864 949',
    bic: 'REVOFRP2',
    owner: 'QUINTIN Florian',
};

export interface InvoiceData {
    type: 'invoice' | 'quote';
    number: string;
    date: string;
    client: {
        name: string;
        email?: string;
        address?: string;
    };
    lines: {
        description: string;
        unit_price: number;
        quantity: number;
    }[];
    total_amount: number;
    discount?: string;
}

const s = StyleSheet.create({
    page: {
        backgroundColor: BG,
        paddingTop: 20 * MM,
        paddingBottom: 20 * MM,
        paddingHorizontal: 20 * MM,
        fontFamily: 'SpaceMono',
        fontSize: 8,
        color: BLACK,
    },
    // Header
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4 * MM,
    },
    title: {
        fontFamily: 'PPMori',
        fontWeight: 'bold',
        fontSize: 36,
        letterSpacing: 1,
    },
    // Pills row
    pillsRow: {
        flexDirection: 'row',
        gap: 3 * MM,
        marginBottom: 5 * MM,
    },
    pill: {
        borderWidth: 1,
        borderColor: BLACK,
        borderRadius: 50,
        paddingHorizontal: 5 * MM,
        paddingVertical: 2 * MM,
        minWidth: 35 * MM,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pillText: {
        fontSize: 10,
        fontFamily: 'SpaceMono',
        fontWeight: 'bold',
    },
    // Separator
    separator: {
        borderBottomWidth: 1,
        borderBottomColor: BLACK,
        marginBottom: 5 * MM,
    },
    // Identity blocks
    identityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8 * MM,
    },
    identityCol: {
        width: '48%',
    },
    identityTitle: {
        fontFamily: 'PPMori',
        fontWeight: 'bold',
        fontSize: 9,
        marginBottom: 2 * MM,
    },
    identityText: {
        fontSize: 8,
        lineHeight: 1.6,
        fontFamily: 'SpaceMono',
    },
    // Table
    table: {
        borderWidth: 1,
        borderColor: BLACK,
        marginBottom: 5 * MM,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: BLACK,
        paddingVertical: 2.5 * MM,
    },
    tableHeaderCell: {
        fontFamily: 'PPMori',
        fontWeight: 'bold',
        fontSize: 8,
        color: WHITE,
        paddingHorizontal: 2 * MM,
    },
    tableRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: BLACK,
        minHeight: 10 * MM,
        alignItems: 'center',
    },
    tableCell: {
        fontSize: 8,
        paddingHorizontal: 2 * MM,
        paddingVertical: 1.5 * MM,
        fontFamily: 'SpaceMono',
    },
    colDesc: { width: '55%', borderRightWidth: 1, borderRightColor: BLACK },
    colPrix: { width: '15%', borderRightWidth: 1, borderRightColor: BLACK, textAlign: 'right' },
    colQts: { width: '12%', borderRightWidth: 1, borderRightColor: BLACK, textAlign: 'center' },
    colTotal: { width: '18%', textAlign: 'right' },
    // Totals
    totalsBlock: {
        alignItems: 'flex-end',
        marginBottom: 5 * MM,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '50%',
        marginBottom: 1.5 * MM,
    },
    totalLabel: {
        fontFamily: 'PPMori',
        fontWeight: 'bold',
        fontSize: 9,
        width: '60%',
        textAlign: 'right',
        paddingRight: 3 * MM,
    },
    totalValue: {
        fontSize: 9,
        width: '40%',
        textAlign: 'right',
        fontFamily: 'SpaceMono',
        fontWeight: 'bold',
    },
    totalBand: {
        flexDirection: 'row',
        backgroundColor: BLACK,
        paddingVertical: 3 * MM,
        paddingHorizontal: 4 * MM,
        width: '55%',
        alignSelf: 'flex-end',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2 * MM,
    },
    totalBandLabel: {
        fontFamily: 'PPMori',
        fontWeight: 'bold',
        fontSize: 14,
        color: WHITE,
    },
    totalBandValue: {
        fontFamily: 'PPMori',
        fontWeight: 'bold',
        fontSize: 14,
        color: WHITE,
    },
    // Footer
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 'auto',
    },
    footerCol: {
        width: '48%',
    },
    footerTitle: {
        fontFamily: 'SpaceMono',
        fontWeight: 'bold',
        fontSize: 7,
        marginBottom: 1.5 * MM,
    },
    footerText: {
        fontSize: 7,
        lineHeight: 1.6,
        fontFamily: 'SpaceMono',
    },
    bottomBar: {
        borderTopWidth: 0.5,
        borderTopColor: '#BBBBBB',
        marginTop: 6 * MM,
        paddingTop: 3 * MM,
        alignItems: 'center',
    },
    thankYou: {
        fontSize: 7,
        fontFamily: 'SpaceMono',
        textAlign: 'center',
        marginBottom: 3 * MM,
    },
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        width: '100%',
    },
    signature: {
        fontSize: 7,
        color: GREY,
        fontStyle: 'italic',
        fontFamily: 'SpaceMono',
    },
    logo: {
        width: 18 * MM,
        height: 12 * MM,
    },
});

export const InvoicePdf: React.FC<{ data: InvoiceData; logoUrl?: string }> = ({ data, logoUrl }) => {
    const docLabel = data.type === 'invoice' ? 'FACTURE' : 'DEVIS';
    const emptyRows = Math.max(0, 5 - (data.lines?.length || 0)); // Minimum 5 rows

    return (
        <Document>
            <Page size="A4" style={s.page}>
                {/* Title */}
                <View style={s.headerRow}>
                    <Text style={s.title}>{docLabel}</Text>
                </View>

                {/* Pills: Number + Date */}
                <View style={s.pillsRow}>
                    <View style={s.pill}>
                        <Text style={s.pillText}>{data.number}</Text>
                    </View>
                    <View style={s.pill}>
                        <Text style={s.pillText}>
                            {data.date ? new Date(data.date).toLocaleDateString('fr-FR') : ''}
                        </Text>
                    </View>
                </View>

                {/* Separator */}
                <View style={s.separator} />

                {/* Identity blocks */}
                <View style={s.identityRow}>
                    <View style={s.identityCol}>
                        <Text style={s.identityTitle}>{COMPANY.name}</Text>
                        <Text style={s.identityText}>{COMPANY.phone}</Text>
                        <Text style={s.identityText}>{COMPANY.email}</Text>
                        <Text style={s.identityText}>{COMPANY.address}</Text>
                    </View>
                    <View style={s.identityCol}>
                        <Text style={s.identityTitle}>À L'ATTENTION DE</Text>
                        <Text style={s.identityText}>{data.client?.name || ''}</Text>
                        {data.client?.email && <Text style={s.identityText}>{data.client.email}</Text>}
                        {data.client?.address && <Text style={s.identityText}>{data.client.address}</Text>}
                    </View>
                </View>

                {/* Table */}
                <View style={s.table}>
                    {/* Header */}
                    <View style={s.tableHeader}>
                        <Text style={[s.tableHeaderCell, { width: '55%' }]}>DESCRIPTION</Text>
                        <Text style={[s.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>PRIX</Text>
                        <Text style={[s.tableHeaderCell, { width: '12%', textAlign: 'center' }]}>QTS</Text>
                        <Text style={[s.tableHeaderCell, { width: '18%', textAlign: 'right' }]}>TOTAL</Text>
                    </View>
                    {/* Rows */}
                    {data.lines?.map((line, i) => (
                        <View style={s.tableRow} key={i}>
                            <Text style={[s.tableCell, s.colDesc]}>{line.description}</Text>
                            <Text style={[s.tableCell, s.colPrix]}>{Number(line.unit_price).toFixed(0)}€</Text>
                            <Text style={[s.tableCell, s.colQts]}>{line.quantity}</Text>
                            <Text style={[s.tableCell, s.colTotal]}>
                                {(line.quantity * line.unit_price).toFixed(0)}€
                            </Text>
                        </View>
                    ))}
                    {/* Empty rows */}
                    {Array.from({ length: emptyRows }).map((_, i) => (
                        <View style={s.tableRow} key={`empty-${i}`}>
                            <Text style={[s.tableCell, s.colDesc]}> </Text>
                            <Text style={[s.tableCell, s.colPrix]}> </Text>
                            <Text style={[s.tableCell, s.colQts]}> </Text>
                            <Text style={[s.tableCell, s.colTotal]}> </Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={s.totalsBlock}>
                    <View style={s.totalRow}>
                        <Text style={s.totalLabel}>SOUS TOTAL :</Text>
                        <Text style={s.totalValue}>{Number(data.total_amount).toFixed(0)}€</Text>
                    </View>
                    <View style={s.totalRow}>
                        <Text style={s.totalLabel}>REMISE :</Text>
                        <Text style={s.totalValue}>{data.discount || '/'}</Text>
                    </View>
                    <View style={s.totalBand}>
                        <Text style={s.totalBandLabel}>TOTAL :</Text>
                        <Text style={s.totalBandValue}>{Number(data.total_amount).toFixed(0)}€</Text>
                    </View>
                </View>

                {/* Footer: Payment + Conditions */}
                <View style={s.footerRow}>
                    <View style={s.footerCol}>
                        <Text style={s.footerTitle}>Paiement à l'ordre de {COMPANY.owner}</Text>
                        <Text style={s.footerText}>IBAN : {COMPANY.iban}</Text>
                        <Text style={s.footerText}>BIC : {COMPANY.bic}</Text>
                    </View>
                    <View style={s.footerCol}>
                        <Text style={s.footerTitle}>Conditions de paiement</Text>
                        <Text style={s.footerText}>Paiement dû sous 15 jours</Text>
                        <Text style={s.footerText}>après réception de la facture</Text>
                    </View>
                </View>

                {/* Bottom bar */}
                <View style={s.bottomBar}>
                    <Text style={s.thankYou}>MERCI DE VOTRE CONFIANCE</Text>
                    <View style={s.signatureRow}>
                        <Text style={s.signature}>SIGNATURE</Text>
                        {logoUrl && <Image src={logoUrl} style={s.logo} />}
                    </View>
                </View>
            </Page>
        </Document>
    );
};
