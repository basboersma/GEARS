"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ChangeOrganizationPassword } from "@/components/owner-dashboard/ChangeOrganizationPassword";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { findClosestCountries, isValidCountry } from "@/lib/countries";
import { findClosestStudies, isValidStudy } from "@/lib/studies";

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-Binary",
  "Other",
  "Prefer Not To Say",
] as const;

const DELETE_CONFIRMATION_PHRASE = "Remove Me From GEARS";

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
  gender: z.enum(GENDER_OPTIONS).optional(),
  nationality: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidCountry(value), {
      message: "Select a valid country from the list",
    }),
  informationProcessingConsent: z
    .boolean()
    .refine((value) => value, { message: "Consent is required to continue" }),
});

interface EditMemberProfileDefaults {
  firstName: string;
  surname: string;
  studentNumber: string;
  educationalInstitution: "University of Groningen" | "Hanze" | "Guest";
  study: string;
  ibanNumber: string;
  gender?: string | null;
  nationality?: string | null;
  informationProcessingConsent: boolean;
}

function SearchableTextField({
  value,
  onChange,
  findMatches,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  findMatches: (query: string) => string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => findMatches(value), [value, findMatches]);

  return (
    <div className="relative">
      <Input
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        value={value}
      />
      {open && matches.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {matches.map((option) => (
            <button
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditMemberProfileForm({
  defaults,
  organizationId,
  organizationRole,
}: {
  defaults: EditMemberProfileDefaults;
  organizationId?: string;
  organizationRole?: "owner" | "admin";
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaults,
      gender: (defaults.gender ?? undefined) as
        | (typeof GENDER_OPTIONS)[number]
        | undefined,
      nationality: defaults.nationality ?? "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/student-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to save profile changes");
      }

      toast.success("Personal information updated");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteData = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch("/api/student-profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to remove your data");
      }

      toast.success("Your identifiable information has been removed");
      setDeleteOpen(false);
      setDeleteConfirmation("");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <SearchableTextField
                    findMatches={findClosestStudies}
                    onChange={field.onChange}
                    placeholder="Start typing a study…"
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

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nationality</FormLabel>
                <FormControl>
                  <SearchableTextField
                    findMatches={findClosestCountries}
                    onChange={field.onChange}
                    placeholder="Start typing a country…"
                    value={field.value ?? ""}
                  />
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
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={field.value}
                  className="size-4"
                  onChange={(event) => field.onChange(event.target.checked)}
                  type="checkbox"
                />
                I consent to the processing of my information.
              </label>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3">
          <Button className="w-fit" disabled={isSaving} type="submit">
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Save changes"
            )}
          </Button>
          {organizationId && organizationRole && (
            <ChangeOrganizationPassword organizationId={organizationId} />
          )}
          <Button
            className="w-fit"
            onClick={() => setDeleteOpen(true)}
            type="button"
            variant="destructive"
          >
            Remove my data
          </Button>
        </div>
      </form>

      <Dialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove all your identifiable information</DialogTitle>
            <DialogDescription>
              This permanently deletes your name, student number, IBAN, gender,
              nationality, and study from our database. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="delete-confirm">
              Type &quot;{DELETE_CONFIRMATION_PHRASE}&quot; to confirm
            </label>
            <Input
              id="delete-confirm"
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              value={deleteConfirmation}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setDeleteOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={
                deleteConfirmation !== DELETE_CONFIRMATION_PHRASE || isDeleting
              }
              onClick={handleDeleteData}
              type="button"
              variant="destructive"
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Permanently remove my data"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
