import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  username: string;
  dashboardUrl: string;
}

const WelcomeEmail = (props: WelcomeEmailProps) => {
  const { username, dashboardUrl } = props;

  return (
    <Html dir="ltr" lang="en">
      <Tailwind>
        <Head />
        <Preview>Welcome to GEARS, {username}!</Preview>
        <Body className="bg-gray-100 py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] rounded-[8px] bg-white p-[40px] shadow-sm">
            <Section className="mb-[32px] text-center">
              <Heading className="m-0 mb-[8px] font-bold text-[28px] text-gray-900">
                Welcome to GEARS!
              </Heading>
              <Text className="m-0 text-[16px] text-gray-600">
                We&apos;re excited to have you on board
              </Text>
            </Section>

            <Section className="mb-[32px]">
              <Text className="m-0 mb-[16px] text-[16px] text-gray-700">
                Hi {username},
              </Text>
              <Text className="m-0 mb-[24px] text-[16px] text-gray-700">
                Your account has been created successfully. You can now sign in
                to your dashboard to manage your profile and get access to
                everything GEARS has to offer.
              </Text>
            </Section>

            <Section className="mb-[32px] text-center">
              <Button
                className="box-border inline-block rounded-[6px] bg-blue-600 px-[24px] py-[12px] font-medium text-[16px] text-white no-underline"
                href={dashboardUrl}
              >
                Go to Dashboard
              </Button>
            </Section>

            <Section className="border-gray-200 border-t pt-[24px]">
              <Text className="m-0 text-center text-[12px] text-gray-500">
                © {new Date().getFullYear()} GEARS. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
