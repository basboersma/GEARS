import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

const trailingSlashPattern = /\/$/;
const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  process.env.BETTER_AUTH_URL?.trim() ||
  "https://gearsnl.org"
).replace(trailingSlashPattern, "");

interface OrganizationInvitationEmailProps {
  email: string;
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
  inviteLink: string;
}

const OrganizationInvitationEmail = (
  props: OrganizationInvitationEmailProps
) => {
  return (
    <Html dir="ltr" lang="en">
      <Tailwind>
        <Head />
        <Preview>You&apos;ve been invited to join {props.teamName}</Preview>
        <Body
          className="bg-[#1a1918] py-[40px] font-sans"
          style={{
            backgroundImage: `url(${appUrl}/BlackBackground.png)`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        >
          <Container className="mx-auto max-w-[600px] rounded-[16px] border border-[#3D3330] bg-[#232120] p-[40px] shadow-sm">
            {/* Header */}
            <Section className="mb-[32px] text-center">
              <Img
                alt="GEARS"
                className="mx-auto mb-[16px]"
                height={56}
                src={`${appUrl}/Logo.png`}
                width={56}
              />
              <Heading className="m-0 mb-[8px] font-bold text-[#FFEDD1] text-[28px]">
                You&apos;re invited!
              </Heading>
              <Text className="m-0 text-[#C4A882] text-[16px]">
                Join {props.teamName} and start collaborating
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="mb-[32px]">
              <Text className="m-0 mb-[16px] text-[#FFEDD1] text-[16px]">
                Hi there,
              </Text>
              <Text className="m-0 mb-[16px] text-[#FFEDD1] text-[16px]">
                <strong>{props.invitedByUsername}</strong> (
                {props.invitedByEmail}) has invited you to join{" "}
                <strong>{props.teamName}</strong> on GEARS.
              </Text>
              <Text className="m-0 mb-[24px] text-[#FFEDD1] text-[16px]">
                Accept this invitation to start collaborating with your team
                members and access all the tools and resources available in your
                organization.
              </Text>
            </Section>

            {/* CTA Button */}
            <Section className="mb-[32px] text-center">
              <Button
                className="box-border inline-block rounded-[6px] bg-[#F0684D] px-[24px] py-[12px] font-medium text-[16px] text-white no-underline"
                href={props.inviteLink}
              >
                Accept Invitation
              </Button>
            </Section>

            {/* Alternative Link */}
            <Section className="mb-[32px]">
              <Text className="m-0 mb-[8px] text-[#C4A882] text-[14px]">
                If the button above doesn&apos;t work, you can also copy and
                paste this link into your browser:
              </Text>
              <Text className="m-0 break-all text-[14px]">
                <Link
                  className="text-[#F0684D] underline"
                  href={props.inviteLink}
                >
                  {props.inviteLink}
                </Link>
              </Text>
            </Section>

            {/* Additional Info */}
            <Section className="mb-[24px] border-[#3D3330] border-t pt-[24px]">
              <Text className="m-0 mb-[8px] text-[#C4A882] text-[14px]">
                <strong>Organization:</strong> {props.teamName}
              </Text>
              <Text className="m-0 mb-[8px] text-[#C4A882] text-[14px]">
                <strong>Invited by:</strong> {props.invitedByUsername} (
                {props.invitedByEmail})
              </Text>
              <Text className="m-0 text-[#C4A882] text-[14px]">
                <strong>Your email:</strong> {props.email}
              </Text>
            </Section>

            {/* Footer */}
            <Section className="border-[#3D3330] border-t pt-[24px]">
              <Text className="m-0 mb-[8px] text-center text-[#7A6555] text-[12px]">
                This invitation was sent to {props.email}. If you weren&apos;t
                expecting this invitation, you can safely ignore this email.
              </Text>
              <Text className="m-0 text-center text-[#7A6555] text-[12px]">
                © {new Date().getFullYear()} GEARS. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrganizationInvitationEmail;
