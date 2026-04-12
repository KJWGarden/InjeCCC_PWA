import QrScanner from "@/components/ui/QrScanner";

export default function ScanPage() {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold">QR 스캔</h1>
        <p className="text-base-content/60 text-sm">
          채플 QR 코드를 스캔하여 출석하세요
        </p>
      </div>
      <QrScanner />
    </div>
  );
}
