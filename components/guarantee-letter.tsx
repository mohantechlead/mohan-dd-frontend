import Image from "next/image";
import {
  TransitDocument,
  TransitDocumentType,
  containerNumberList,
  formatGuaranteeMoney,
  formatOrdinalDate,
} from "@/lib/transit-documents";

interface GuaranteeLetterProps {
  document: TransitDocument;
}

function LetterHead() {
  return (
    <div className="text-center space-y-1">
      <Image
        src="/logo.png"
        alt="Mohan PLC logo"
        width={72}
        height={72}
        className="mx-auto mb-2"
        priority
      />
      <h1 className="text-[22px] font-bold uppercase tracking-[0.18em] text-black">
        Mohan PLC
      </h1>
      <p className="text-[13px] font-semibold uppercase tracking-wide text-black">
        Dire Dawa Free Trade Zone Branch
      </p>
      <p className="text-[12px] text-black">
        E-MAIL:{" "}
        <span className="underline">
          harsh@mohanplc.com
        </span>
      </p>
      <p className="text-[12px] font-semibold text-black">
        TEL: +251-11-6621849
      </p>
    </div>
  );
}

function SignatureBlock({ label }: { label: string }) {
  return (
    <div className="mt-8 space-y-2">
      <p className="text-[13px] text-black">{label}</p>
      <div className="flex items-end gap-6">
        <div className="flex flex-col items-start">
          <Image
            src="/signature.png"
            alt="Authorised signature"
            width={150}
            height={70}
            loading="eager"
            unoptimized
            className="h-[56px] w-auto object-contain"
          />
          <div className="mt-1 border-t border-black pt-1 text-[13px] text-black">
            Harsh Kothari
          </div>
          <p className="text-[12px] text-black">Deputy General Manager</p>
        </div>
        <Image
          src="/stamp.png"
          alt="Mohan PLC stamp"
          width={170}
          height={170}
          loading="eager"
          unoptimized
          className="h-[128px] w-auto object-contain"
        />
      </div>
    </div>
  );
}

function LetterShell({
  document,
  subject,
  recipientLines,
  children,
}: {
  document: TransitDocument;
  subject: React.ReactNode;
  recipientLines: string[];
  children: React.ReactNode;
}) {
  return (
    <article className="guarantee-letter mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white px-[18mm] py-[16mm] text-black shadow-sm print:shadow-none">
      <LetterHead />

      <div className="mt-6 flex justify-end">
        <div className="space-y-1 text-right text-[13px] text-black">
          <p>Date: {formatOrdinalDate(document.document_date)}</p>
          <p>Ref: {document.reference_number}</p>
        </div>
      </div>

      <div className="mt-6 space-y-1 text-[13px] leading-6 text-black">
        <p className="font-bold">To:</p>
        {recipientLines.map((line, index) => (
          <p
            key={`${line}-${index}`}
            className={index === recipientLines.length - 1 ? "underline" : ""}
          >
            {line}
          </p>
        ))}
      </div>

      <h2 className="mt-6 text-center text-[14px] font-bold underline">
        {subject}
      </h2>

      <div className="mt-4 flex-1 space-y-3 text-justify text-[13px] leading-5 text-black">
        {children}
      </div>
    </article>
  );
}

function AmharicField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-end gap-3 text-[12px] leading-6">
      <span className="whitespace-nowrap">{label}</span>
      <span className="min-w-[40px] flex-1 border-b border-dotted border-black pb-0.5 font-medium">
        {value || "\u00a0"}
      </span>
    </div>
  );
}

function ContainerReleaseForm({ document }: { document: TransitDocument }) {
  const snapshot = document.snapshot ?? {};
  const containers = snapshot.containers ?? [];
  const sizes = Array.from(
    new Set(containers.map((container) => container.size).filter(Boolean))
  );
  const containerCount = containers.length || snapshot.container_count || 0;
  const containerSize = `${containerCount}x${sizes.join("/") || "40"}`;

  // The form has three columns of ruled lines filled top-to-bottom.
  const rows = Math.max(4, Math.ceil(containers.length / 3));
  const slots: Array<string | null> = Array.from(
    { length: rows * 3 },
    () => null
  );
  containers.forEach((container, index) => {
    const column = Math.floor(index / rows);
    const row = index % rows;
    const slot = row * 3 + column;
    if (slot < slots.length) slots[slot] = container.container_number;
  });

  return (
    <article
      className="guarantee-letter mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white px-[18mm] py-[16mm] text-black shadow-sm print:shadow-none"
      style={{
        fontFamily: '"Nyala", "Ebrima", "Abyssinica SIL", sans-serif',
      }}
    >
      <h2 className="text-center text-[16px] font-bold leading-8 underline">
        ጉዳዩ፡ የባዶ ኮንቴነር ዋስትና ይመለከታል
      </h2>

      <p className="mt-8 text-[13px]">አስመጪ MOHAN PLC</p>

      <div className="mt-4 space-y-1.5">
        <AmharicField label="ወኪል" value={""} />
        <AmharicField
          label="ዲ/ዩን ቁጥር"
          value={snapshot.declaration_number}
        />
        <AmharicField label="የኮንቴነር ቁጥር እና ስፋት" value={containerSize} />
        <AmharicField
          label="የማስጫኛ ሰነድ ቁጥር"
          value={snapshot.bl_number}
        />
        <AmharicField
          label="የኮንቴነሩ/ሮች የብር መጠን"
          value={formatGuaranteeMoney(snapshot.customs_value)}
        />
        <AmharicField
          label="ኮንቴነሩ/ሮች ወደ ሀገር እንዲገቡ የተፈቀደበት ቀን"
          value=""
        />
      </div>

      <p className="mt-4 text-justify text-[12px] leading-6">
        ኮንቴነሩ/ሮች ወደ ሀገር ማስገባት እንዲፈቀድልን እየጠየቅን ወደ ሀገር እንዲገባ
        ከተፈቀደበት ቀን ጀምሮ በሶስት ወር ጊዜ ወስጥ ከሀገር ባይወጣ ቀረጥና ታክሱን የምንከፍል
        መሆኑን እንገልጻለን።
      </p>

      <div className="mt-6 grid grid-cols-3 gap-x-8 gap-y-4">
        {slots.map((containerNumber, index) => (
          <div
            key={`slot-${index}`}
            className="min-h-[22px] border-b border-black text-[12px] leading-5"
          >
            {containerNumber}
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-12 text-[12px]">
        <div>
          <p>የአስመጪው ፊርማና ማህተም</p>
          <div className="mt-2 flex items-end gap-4">
            <Image
              src="/signature.png"
              alt="Authorised signature"
              width={150}
              height={70}
              loading="eager"
              unoptimized
              className="h-[54px] w-auto object-contain"
            />
            <Image
              src="/stamp.png"
              alt="Mohan PLC stamp"
              width={170}
              height={170}
              loading="eager"
              unoptimized
              className="h-[105px] w-auto object-contain"
            />
          </div>
          <div className="mt-1 border-t border-black" />

          <p className="mt-8">የቦንድ ኦፊሰር ፊርማና ማህተም</p>
          <div className="mt-12 border-t border-black" />
        </div>

        <div>
          <p>የወኪሉ ፊርማና ማህተም</p>
          <div className="mt-10 border-t border-black" />
          <div className="mt-14 border-t border-black" />
        </div>
      </div>

      <div className="flex-1" />

      <div className="mt-6 text-[12px] leading-6">
        <p className="font-semibold underline">ማስታወሻ፡</p>
        <p className="mt-1 pl-4">• የድርጅቱ ደብዳቤ አባሪ ሆኖ መያያዝ ይኖርበታል</p>
      </div>
    </article>
  );
}

function ContainerGuarantee({ document }: { document: TransitDocument }) {
  const snapshot = document.snapshot ?? {};
  const containers = containerNumberList(snapshot.containers);
  const containerCount = snapshot.container_size_summary || "0 x 40'";
  const containerQuantity =
    snapshot.containers?.length ?? snapshot.container_count ?? 0;
  const returnDays = snapshot.return_days ?? 90;

  return (
    <>
      <LetterShell
        document={document}
        subject={`Subject: Guarantee for ${containerCount} Container`}
        recipientLines={["Dire Dawa Customs Branch Office", "Ethiopia"]}
      >
        <p>
          Reference is made to the shipment consigned to MOHAN PLC, dispatched
          from {snapshot.port_of_loading || "—"}, under Bill of Lading No.{" "}
          {snapshot.bl_number || "—"}.
        </p>
        <p>
          We hereby confirm that the {containerCount} container
          {containerQuantity === 1 ? "" : "s"}, bearing container number{" "}
          <span className="font-bold">{containers || "—"}</span> will be returned
          within <span className="font-bold">{returnDays} days</span> following
          the unloading of the goods.
        </p>
        <p>Thank you in advance for your cooperation.</p>
        <SignatureBlock label="Sincerely," />
      </LetterShell>
      <ContainerReleaseForm document={document} />
    </>
  );
}

function LetterOfGuarantee({ document }: { document: TransitDocument }) {
  const snapshot = document.snapshot ?? {};

  return (
    <LetterShell
      document={document}
      subject="Subject: Letter of Guarantee"
      recipientLines={[
        "Customs Office Dire Dawa Free Trade Zone",
        "Dire Dawa",
        "Ethiopia",
      ]}
    >
      <p>Dear Sir/Madam,</p>
      <p>
        This letter constitutes our guarantee, located at Dire Dawa this letter of guarantee in reference
        to the customs declaration made for the goods being imported through the
        Dire Dawa Free Trade Zone.
      </p>
      <p>
        Under declaration number{" "}
        <span className="font-bold">{snapshot.declaration_number || "—"}</span>{" "}
        dated {formatOrdinalDate(snapshot.declaration_date)} and with a value of
        USD {formatGuaranteeMoney(snapshot.customs_value)}
        {snapshot.duty_value !== null && snapshot.duty_value !== undefined
          ? ` and duty value ${formatGuaranteeMoney(snapshot.duty_value)}`
          : ""}.
      </p>
      <p>
        We guarantee that all information provided in the customs declaration
        is accurate and complete to the best of our knowledge. Furthermore, we
        confirm that all applicable customs duties, taxes, and fees will be duly
        paid in accordance with the regulations of the Dire Dawa Free Trade
        Zone.
      </p>
      <p>
        We would also like to confirm to you that we are an Authorized Economic
        Operator (AEO) under certificate reference number AEO-GOLD/075/26.
      </p>
      <p>
        We assure you of our full cooperation in any investigations or audits
        that may be conducted by the customs authorities.
      </p>
      <p>Thank you for your attention to this matter.</p>
      <SignatureBlock label="Sincerely yours," />
    </LetterShell>
  );
}

function ClosureGuarantee({ document }: { document: TransitDocument }) {
  const snapshot = document.snapshot ?? {};

  return (
    <LetterShell
      document={document}
      subject="Subject: Notification on Closure of Guarantee Letter"
      recipientLines={[
        "Customs Office Dire Dawa Free Trade Zone",
        "Dire Dawa",
        "Ethiopia",
      ]}
    >
      <p>
        Mohan PLC presents its compliments to the Ethiopian Customs Commission
        of the Federal Democratic Republic of Ethiopia.
      </p>
      <p>
        As the designated operator of the Dire Dawa Free Trade Zone, and holder
        of the appropriate investment licenses to import goods and sell them
        within inland Ethiopia, we refer to our previous letter dated{" "}
        {formatOrdinalDate(snapshot.previous_letter_date)}, with reference
        number{" "}
        <span className="font-bold">
          {snapshot.previous_letter_reference || "—"}
        </span>
        . In that correspondence, we guaranteed that all the information
        provided in the customs declaration is accurate and complete to the
        best of our knowledge, for goods brought into the Free Trade Zone under
        declaration number{" "}
        <span className="font-bold">{snapshot.declaration_number || "—"}</span>{" "}
        under the IM-8 category.
      </p>
      <p>
        We are pleased to inform you that the goods referenced in that
        declaration have now successfully arrived at our warehouse, with all
        required regulatory procedures duly completed.
      </p>
      <p>
        Accordingly, we hereby formally notify you that the guarantee letter
        associated is no longer valid.
      </p>
      <p>
        We appreciate your cooperation and look forward to your continued
        support.
      </p>
      <SignatureBlock label="Yours Sincerely," />
    </LetterShell>
  );
}

const LETTER_COMPONENTS: Record<
  TransitDocumentType,
  (props: { document: TransitDocument }) => React.ReactNode
> = {
  container_guarantee: ContainerGuarantee,
  letter_guarantee: LetterOfGuarantee,
  closure_guarantee: ClosureGuarantee,
};

export default function GuaranteeLetter(props: GuaranteeLetterProps) {
  const Component =
    LETTER_COMPONENTS[props.document.document_type] ?? ContainerGuarantee;
  return <Component document={props.document} />;
}
