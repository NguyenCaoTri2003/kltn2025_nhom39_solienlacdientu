import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Wallet, PiggyBank, TrendingDown, ChevronDown } from "lucide-react-native";
import HeaderBar from "../components/HeaderBar";
import LoadingScreen from "../components/LoadingScreen";
import { useUser } from "../context/UserContext";
import { useTuitionFees } from "../hooks/useTuitionFees";
import { Semester } from "../services/semesterService";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const formatCurrency = (value?: number | string | null) =>
    currencyFormatter.format(Number(value ?? 0));

export default function TuitionFeesScreen() {
    const { userData } = useUser();
    const isParent = userData?.role === "parent";
    const children = userData?.children || [];
    const [selectedChildIndex, setSelectedChildIndex] = useState(0);
    const activeChild = isParent ? children[selectedChildIndex] : null;
    const [semesterPickerVisible, setSemesterPickerVisible] = useState(false);

    const studentId = isParent ? activeChild?.id : userData?.student?.id;
    const studentYear = isParent ? activeChild?.academic_year : userData?.student?.academic_year;

    const { semester, semesters, setSemester, fees, loading, error, loadFeesBySemester } =
        useTuitionFees(studentYear, studentId);

    const summaryStats = useMemo(() => {
        return fees.reduce(
            (acc, fee) => {
                acc.payable += Number(fee.payable_amount ?? 0);
                acc.paid += Number(fee.paid_amount ?? 0);
                acc.debt += Number(fee.debt_amount ?? 0);
                return acc;
            },
            { payable: 0, paid: 0, debt: 0 }
        );
    }, [fees]);

    const handleSelectSemester = async (s: Semester) => {
        setSemester(s);
        await loadFeesBySemester(s.id);
    };

    if (loading && !semester) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
                <HeaderBar title="Học phí" />
                <LoadingScreen text="Đang tải dữ liệu học phí..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
            <HeaderBar title="Học phí" />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
                {isParent && children.length > 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.childTabs}
                    >
                        {children.map((child: any, index: number) => {
                            const isActive = selectedChildIndex === index;
                            return (
                                <TouchableOpacity
                                    key={child.id}
                                    style={[styles.childTab, isActive && styles.childTabActive]}
                                    onPress={() => setSelectedChildIndex(index)}
                                >
                                    <Text style={[styles.childTabText, isActive && styles.childTabTextActive]}>
                                        {child.users?.full_name ?? `Con ${index + 1}`}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}

                {/* Semester selector */}
                <View style={styles.semesterSelectorContainer}>
                    {semesters.length === 0 ? (
                        <View style={styles.semesterSkeleton}>
                            <ActivityIndicator color="#0284C7" size="small" />
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.semesterSelect}
                                onPress={() => setSemesterPickerVisible(true)}
                            >
                                <Text
                                    style={
                                        semester ? styles.semesterSelectText : styles.semesterSelectPlaceholder
                                    }
                                >
                                    {semester
                                        ? `${semester.name} (${semester.academic_year})`
                                        : "Chọn học kỳ"}
                                </Text>
                                <ChevronDown color="#6B7280" size={18} />
                            </TouchableOpacity>

                            <Modal
                                visible={semesterPickerVisible}
                                transparent
                                animationType="slide"
                                onRequestClose={() => setSemesterPickerVisible(false)}
                            >
                                <TouchableOpacity
                                    style={styles.modalOverlay}
                                    activeOpacity={1}
                                    onPressOut={() => setSemesterPickerVisible(false)}
                                >
                                    <View style={styles.modalContent}>
                                        <View style={styles.modalHeader}>
                                            <Text style={styles.modalTitle}>Chọn học kỳ</Text>

                                            <TouchableOpacity
                                                style={styles.modalCloseInline}
                                                onPress={() => setSemesterPickerVisible(false)}
                                            >
                                                <Text style={styles.modalCloseInlineText}>Đóng</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <ScrollView>
                                            {semesters.map((s) => {
                                                const active = semester?.id === s.id;
                                                return (
                                                    <TouchableOpacity
                                                        key={s.id}
                                                        style={[
                                                            styles.modalItem,
                                                            active && styles.modalItemActive,
                                                        ]}
                                                        onPress={async () => {
                                                            await handleSelectSemester(s);
                                                            setSemesterPickerVisible(false);
                                                        }}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.modalItemText,
                                                                active && styles.modalItemTextActive,
                                                            ]}
                                                        >
                                                            {s.name} ({s.academic_year})
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    </View>
                                </TouchableOpacity>
                            </Modal>
                        </>
                    )}
                </View>

                {/* Summary cards */}
                {!loading && fees.length > 0 && (
                    <View style={styles.summaryGrid}>
                        <SummaryCard
                            label="Tổng mức phải nộp"
                            value={formatCurrency(summaryStats.payable)}
                            subtext="Bao gồm tất cả khoản thu"
                            Icon={Wallet}
                            color="#2563EB"
                            bgColor="#DBEAFE"
                        />
                        <SummaryCard
                            label="Đã thanh toán"
                            value={formatCurrency(summaryStats.paid)}
                            subtext="Số tiền đã ghi nhận"
                            Icon={PiggyBank}
                            color="#059669"
                            bgColor="#D1FAE5"
                        />
                        <SummaryCard
                            label="Công nợ còn lại"
                            value={formatCurrency(summaryStats.debt)}
                            subtext="Cần thanh toán thêm"
                            Icon={TrendingDown}
                            color="#D97706"
                            bgColor="#FEF3C7"
                        />
                    </View>
                )}

                {error && !loading && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {!error && fees.length === 0 && !loading && semester && (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>Không có dữ liệu học phí</Text>
                    </View>
                )}

                {/* Tuition table */}
                <FeeSection
                    title="Danh sách khoản thu học phí"
                    description="Chi tiết học phí theo từng lớp học phần và ưu đãi"
                    fees={fees.filter((f) => f.fee_type === "tuition")}
                    tuition
                />

                {/* Other fees */}
                <FeeSection
                    title="Danh sách khoản thu khác"
                    description="Các khoản phí bổ sung và thời hạn thanh toán"
                    fees={fees.filter((f) => f.fee_type !== "tuition")}
                    tuition={false}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

function SummaryCard({
    label,
    value,
    subtext,
    Icon,
    color,
    bgColor,
}: {
    label: string;
    value: string;
    subtext: string;
    Icon: typeof Wallet;
    color: string;
    bgColor: string;
}) {
    return (
        <View style={styles.summaryCard}>
            <View>
                <Text style={styles.summaryLabel}>{label}</Text>
                <Text style={styles.summaryValue}>{value}</Text>
                <Text style={styles.summarySubtext}>{subtext}</Text>
            </View>
            <View style={[styles.summaryIconWrapper, { backgroundColor: bgColor }]}>
                <Icon color={color} size={22} />
            </View>
        </View>
    );
}

type FeeSectionProps = {
    title: string;
    description: string;
    fees: any[];
    tuition: boolean;
};

function FeeSection({ title, description, fees, tuition }: FeeSectionProps) {
    if (fees.length === 0) return null;

    return (
        <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionDescription}>{description}</Text>

            <FlatList
                data={fees}
                keyExtractor={(item) => String(item.id)}
                scrollEnabled={false}
                renderItem={({ item, index }) => <FeeItem fee={item} index={index} tuition={tuition} />}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
        </View>
    );
}

function FeeItem({ fee, index, tuition }: { fee: any; index: number; tuition: boolean }) {
    return (
        <View style={styles.feeCard}>
            <View style={styles.feeHeaderRow}>
                <Text style={styles.feeIndex}>#{index + 1}</Text>
                {tuition ? (
                    <Text style={styles.feeCode}>{fee.class_code}</Text>
                ) : (
                    <Text style={styles.feeCode}>{fee.fee_code}</Text>
                )}
            </View>

            <Text style={styles.feeTitle}>{fee.description}</Text>

            {tuition && (
                <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Số tín chỉ</Text>
                    <Text style={styles.feeValue}>{fee.credit ?? "-"}</Text>
                </View>
            )}

            <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Mức phí ban đầu</Text>
                <Text style={styles.feeValue}>{formatCurrency(fee.base_amount)}</Text>
            </View>

            {tuition && (
                <>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Miễn giảm</Text>
                        <Text style={styles.feeValue}>
                            {fee.discount_percent}% ({formatCurrency(fee.discount_amount)})
                        </Text>
                    </View>
                    <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Mức phải nộp</Text>
                        <Text style={[styles.feeValue, { color: "#2563EB", fontWeight: "700" }]}>
                            {formatCurrency(fee.payable_amount)}
                        </Text>
                    </View>
                </>
            )}

            {!tuition && (
                <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Mức phải nộp</Text>
                    <Text style={[styles.feeValue, { color: "#2563EB", fontWeight: "700" }]}>
                        {formatCurrency(fee.payable_amount)}
                    </Text>
                </View>
            )}

            <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Đã nộp</Text>
                <Text style={styles.feeValue}>{formatCurrency(fee.paid_amount)}</Text>
            </View>

            <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Công nợ</Text>
                <Text style={[styles.feeValue, { fontWeight: "700" }]}>
                    {formatCurrency(fee.debt_amount)}
                </Text>
            </View>

            <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Ngày nộp</Text>
                <Text style={styles.feeValue}>
                    {fee.paid_date ? String(fee.paid_date).split("T")[0] : "-"}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 16,
    },
    childTabs: {
        paddingVertical: 6,
        paddingHorizontal: 6,
        gap: 8,
    },
    childTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: "#E5E7EB",
    },
    childTabActive: {
        backgroundColor: "#1E3A8A",
    },
    childTabText: {
        color: "#374151",
        fontSize: 14,
        fontWeight: "500",
    },
    childTabTextActive: {
        color: "#FFFFFF",
    },
    semesterSelectorContainer: {
        marginTop: 4,
    },
    semesterSkeleton: {
        height: 40,
        borderRadius: 999,
        backgroundColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
    },
    semesterSelect: {
        height: 44,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
    },
    semesterSelectText: {
        fontSize: 14,
        color: "#111827",
        fontWeight: "500",
    },
    semesterSelectPlaceholder: {
        fontSize: 14,
        color: "#9CA3AF",
    },
    semesterChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "#E5E7EB",
    },
    semesterChipActive: {
        backgroundColor: "#1E3A8A",
    },
    semesterChipText: {
        color: "#374151",
        fontSize: 13,
    },
    semesterChipTextActive: {
        color: "#FFFFFF",
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "flex-end",
    },
    modalContent: {
        maxHeight: "60%",
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    //   modalHeader: {
    //     flexDirection: "row",
    //     alignItems: "center",
    //     justifyContent: "space-between",
    //     marginBottom: 8,
    //   },
    //   modalTitle: {
    //     fontSize: 16,
    //     fontWeight: "700",
    //     color: "#111827",
    //     marginBottom: 8,
    //   },
    modalItem: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    modalItemActive: {
        backgroundColor: "#EFF6FF",
    },
    modalItemText: {
        fontSize: 14,
        color: "#111827",
    },
    modalItemTextActive: {
        fontWeight: "600",
        color: "#1D4ED8",
    },
    modalClose: {
        marginTop: 10,
        alignSelf: "flex-end",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#E5E7EB",
    },
    modalCloseText: {
        fontSize: 14,
        color: "#111827",
        fontWeight: "500",
    },
    summaryGrid: {
        marginTop: 12,
        flexDirection: "column",
        gap: 12,
    },
    summaryCard: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    summaryLabel: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 1,
        color: "#6B7280",
    },
    summaryValue: {
        marginTop: 4,
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    summarySubtext: {
        fontSize: 11,
        marginTop: 2,
        color: "#9CA3AF",
    },
    summaryIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    errorBox: {
        marginTop: 8,
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#FEE2E2",
    },
    errorText: {
        color: "#B91C1C",
        fontSize: 13,
    },
    emptyBox: {
        marginTop: 8,
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#EFF6FF",
    },
    emptyText: {
        color: "#1D4ED8",
        fontSize: 13,
    },
    sectionContainer: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    sectionDescription: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 2,
        marginBottom: 8,
    },
    feeCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    feeHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    feeIndex: {
        fontSize: 12,
        color: "#6B7280",
    },
    feeCode: {
        fontSize: 12,
        color: "#4B5563",
        fontWeight: "500",
    },
    feeTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 6,
    },
    feeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 2,
    },
    feeLabel: {
        fontSize: 13,
        color: "#6B7280",
    },
    feeValue: {
        fontSize: 13,
        color: "#111827",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 6,
        paddingBottom: 12,
    },

    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },

    modalCloseInline: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#E5E7EB",
        borderRadius: 999,
    },

    modalCloseInlineText: {
        fontSize: 14,
        color: "#111827",
        fontWeight: "500",
    },

});


