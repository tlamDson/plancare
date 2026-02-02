/**
 * CTA Section Component
 */

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to start planning?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of travelers who plan smarter with AI.
          </p>
          <Link to="/signup">
            <Button size="lg">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
