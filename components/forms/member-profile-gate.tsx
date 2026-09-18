"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { findClosestStudies, isValidStudy } from "@/lib/studies";

const formSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  surname: z.string().trim().min(1, "Surname is required"),
  studentNumber: z.string().trim().min(1, "Student number is required"),
  educationalInstitution: z.enum(["University of Groningen", "Hanze", "Guest"]),
  study: z
    .string()
    .trim()
    .min(1, "Study is required")
    .refine((value) => isValidStudy(value), {
      message: "Select a valid study from the list",
    }),
  ibanNumber: z.string().trim().min(1, "IBAN is required"),
  informationProcessingConsent: z
    .boolean()
    .refine((value) => value, { message: "Consent is required to continue" }),
});

function StudyField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => findClosestStudies(value), [value]);

  return (
    <div className="relative">
      <Input
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Start typing a study…"
        value={value}
      />
      {open && matches.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {matches.map((study) => (
            <button
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
              key={study}
              onClick={() => {
                onChange(study);
                setOpen(false);
              }}
              type="button"
            >
              {study}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface StudentProfileDefaults {
  firstName: string;
  surname: string;
  studentNumber: string;
  educationalInstitution: "University of Groningen" | "Hanze" | "Guest";
  study: string;
  ibanNumber: string;
  informationProcessingConsent: boolean;
}

export function MemberProfileGate({
  defaults,
}: {
  defaults?: Partial<StudentProfileDefaults>;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [pdfPopup, setPdfPopup] = useState<{
    open: boolean;
    title: string;
    src: string;
  }>({
    open: false,
    title: "",
    src: "",
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: defaults?.firstName ?? "",
      surname: defaults?.surname ?? "",
      studentNumber: defaults?.studentNumber ?? "",
      educationalInstitution: defaults?.educationalInstitution ?? "Guest",
      study: defaults?.study ?? "",
      ibanNumber: defaults?.ibanNumber ?? "",
      informationProcessingConsent:
        defaults?.informationProcessingConsent ?? false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/student-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to save profile");
      }

      toast.success("Profile completed successfully");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const openPdfPopup = (title: string, src: string) => {
    setPdfPopup({
      open: true,
      title,
      src,
    });
  };

  return (
    <>
      <Dialog open>
        <DialogContent
          className="sm:max-w-2xl"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>Complete your profile</DialogTitle>
            <DialogDescription>
              You must complete this form before you can continue using the
              site.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surname</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="educationalInstitution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Educational institution</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select an institution" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="University of Groningen">
                              University of Groningen
                            </SelectItem>
                            <SelectItem value="Hanze">Hanze</SelectItem>
                            <SelectItem value="Guest">Guest</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="study"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Study</FormLabel>
                      <FormControl>
                        <StudyField
                          onChange={field.onChange}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ibanNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IBAN number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="informationProcessingConsent"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-2 text-sm">
                      <input
                        checked={field.value}
                        className="mt-1 size-4"
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                        type="checkbox"
                      />
                      <p>
                        I consent to the fact that I will fall under the{" "}
                        <button
                          className="underline"
                          onClick={() =>
                            openPdfPopup(
                              "General House Rules",
                              "/house_rules_gears.pdf"
                            )
                          }
                          type="button"
                        >
                          general house rules
                        </button>{" "}
                        when working in a team or committee under the
                        jurisdiction of Gears. Additionally I consent to the{" "}
                        <button
                          className="underline"
                          onClick={() =>
                            openPdfPopup(
                              "Data processing",
                              "/house_rules_gears.pdf"
                            )
                          }
                          type="button"
                        >
                          processing
                        </button>{" "}
                        of my information.
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="w-full" disabled={isSaving} type="submit">
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) =>
          setPdfPopup((current) => ({
            ...current,
            open,
          }))
        }
        open={pdfPopup.open}
      >
        <DialogContent className="!w-[96vw] !max-w-[96vw] sm:!max-w-[96vw] h-[92vh] gap-0 overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{pdfPopup.title}</DialogTitle>
          </DialogHeader>

          <iframe
            className="h-full w-full border-0"
            src={pdfPopup.src}
            title={pdfPopup.title}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
