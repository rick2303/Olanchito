interface DeviceMacbookMockupProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export default function DeviceMacbookMockup({
  src,
  alt,
  className = "",
  loading = "lazy",
}: DeviceMacbookMockupProps) {
  return (
    <div className={`mqy-macbook-wrap ${className}`.trim()}>
      <div className="device device-macbook-pro device-spacegray mqy-macbook">
        <div className="device-frame">
          <img className="device-screen" src={src} alt={alt} loading={loading} decoding="async" />
        </div>
        <div className="device-header" />
        <div className="device-power" />
      </div>
    </div>
  );
}
