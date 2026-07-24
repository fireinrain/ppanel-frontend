"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { Combobox } from "@workspace/ui/composed/combobox";
import { EnhancedInput } from "@workspace/ui/composed/enhanced-input";
import { Icon } from "@workspace/ui/composed/icon";
import TagInput from "@workspace/ui/composed/tag-input";
import type { TFunction } from "i18next";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { useNode } from "@/stores/node";
import { useServer } from "@/stores/server";
import {
  type FieldConfig,
  getLabel,
  getProtocolDefaultConfig,
  type ProtocolType,
  protocols,
  useProtocolFields,
} from "../servers/form-schema";

export type ProtocolName = ProtocolType;

export const PROTOCOL_COLORS: Record<string, string> = {
  shadowsocks: "bg-green-100 text-green-700 border-green-200",
  vmess: "bg-blue-100 text-blue-700 border-blue-200",
  vless: "bg-purple-100 text-purple-700 border-purple-200",
  trojan: "bg-red-100 text-red-700 border-red-200",
  hysteria2: "bg-orange-100 text-orange-700 border-orange-200",
  tuic: "bg-pink-100 text-pink-700 border-pink-200",
  anytls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  naive: "bg-cyan-100 text-cyan-700 border-cyan-200",
  mieru: "bg-indigo-100 text-indigo-700 border-indigo-200",
  shadowsocksr: "bg-teal-100 text-teal-700 border-teal-200",
  snell: "bg-gray-100 text-gray-700 border-gray-200",
};

function getFieldLabel(field: FieldConfig) {
  return (
    <>
      {field.label}
      {field.required ? (
        <span aria-hidden="true" className="ml-1 text-destructive">
          *
        </span>
      ) : null}
    </>
  );
}

function DynamicField({
  field,
  control,
  form,
  protocolData,
}: {
  field: FieldConfig;
  control: any;
  form: any;
  protocolData: any;
}) {
  const fieldName = `protocol_config.${field.name}` as const;

  if (field.condition && !field.condition(protocolData, {})) {
    return null;
  }

  const commonProps = {
    control,
    name: fieldName,
    defaultValue: field.defaultValue,
  };

  switch (field.type) {
    case "input":
      return (
        <FormField
          {...commonProps}
          render={({ field: fieldProps }) => (
            <FormItem>
              <FormLabel>{getFieldLabel(field)}</FormLabel>
              <FormControl>
                <EnhancedInput
                  {...fieldProps}
                  onValueChange={(v) => fieldProps.onChange(v)}
                  placeholder={field.placeholder}
                  suffix={
                    field.generate ? (
                      field.generate.functions &&
                      field.generate.functions.length > 0 ? (
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" type="button" variant="ghost">
                              <Icon className="h-4 w-4" icon="mdi:key" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {field.generate.functions.map((genFunc, idx) => (
                              <DropdownMenuItem
                                key={idx}
                                onClick={async () => {
                                  const result = await genFunc.function();
                                  if (typeof result === "string") {
                                    fieldProps.onChange(result);
                                  } else if (field.generate!.updateFields) {
                                    Object.entries(
                                      field.generate!.updateFields
                                    ).forEach(([name, resultKey]) => {
                                      const fullFieldName = `protocol_config.${name}`;
                                      form.setValue(
                                        fullFieldName,
                                        (result as any)[resultKey]
                                      );
                                    });
                                  } else if (result.privateKey) {
                                    fieldProps.onChange(result.privateKey);
                                  }
                                }}
                              >
                                {genFunc.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : field.generate.function ? (
                        <Button
                          onClick={async () => {
                            const result = await field.generate!.function!();
                            if (typeof result === "string") {
                              fieldProps.onChange(result);
                            } else if (field.generate!.updateFields) {
                              Object.entries(
                                field.generate!.updateFields
                              ).forEach(([name, resultKey]) => {
                                const fullFieldName = `protocol_config.${name}`;
                                form.setValue(
                                  fullFieldName,
                                  (result as any)[resultKey]
                                );
                              });
                            } else if (result.privateKey) {
                              fieldProps.onChange(result.privateKey);
                            }
                          }}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <Icon className="h-4 w-4" icon="mdi:key" />
                        </Button>
                      ) : null
                    ) : (
                      field.suffix
                    )
                  }
                  type="text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "number":
      return (
        <FormField
          {...commonProps}
          render={({ field: fieldProps }) => (
            <FormItem>
              <FormLabel>{getFieldLabel(field)}</FormLabel>
              <FormControl>
                <EnhancedInput
                  {...fieldProps}
                  max={field.max}
                  min={field.min}
                  onValueChange={(v) => fieldProps.onChange(v)}
                  placeholder={field.placeholder}
                  step={field.step || 1}
                  suffix={field.suffix}
                  type="number"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "select":
      if (!field.options || field.options.length <= 1) {
        return null;
      }

      return (
        <FormField
          {...commonProps}
          render={({ field: fieldProps }) => (
            <FormItem>
              <FormLabel>{getFieldLabel(field)}</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(value) => {
                    fieldProps.onChange(value);
                    if (field.name === "security") {
                      if (
                        value === "tls" &&
                        protocolData.cert_mode === "none"
                      ) {
                        form.setValue("protocol_config.cert_mode", "self");
                      }
                      if (value === "reality") {
                        form.setValue("protocol_config.transport", "tcp");
                        form.setValue("protocol_config.cert_mode", "none");
                      }
                    }
                    if (field.name === "plugin" && value === "none") {
                      form.setValue("protocol_config.plugin_opts", null);
                    }
                  }}
                  value={String(fieldProps.value ?? field.defaultValue ?? "")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {getLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "switch":
      return (
        <FormField
          {...commonProps}
          render={({ field: fieldProps }) => (
            <FormItem>
              <FormLabel>{getFieldLabel(field)}</FormLabel>
              <FormControl>
                <div className="pt-2">
                  <Switch
                    checked={!!fieldProps.value}
                    onCheckedChange={(checked) => fieldProps.onChange(checked)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "textarea":
      return (
        <FormField
          {...commonProps}
          render={({ field: fieldProps }) => (
            <FormItem className="col-span-2">
              <FormLabel>{getFieldLabel(field)}</FormLabel>
              <FormControl>
                <textarea
                  {...fieldProps}
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => fieldProps.onChange(e.target.value)}
                  placeholder={field.placeholder}
                  value={fieldProps.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "string-list":
      return (
        <FormField
          {...commonProps}
          render={({ field: fieldProps }) => (
            <FormItem className="col-span-2">
              <FormLabel>{getFieldLabel(field)}</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(event) =>
                    fieldProps.onChange(
                      event.target.value
                        .split("\n")
                        .map((value) => value.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder={field.placeholder}
                  value={
                    Array.isArray(fieldProps.value)
                      ? fieldProps.value.join("\n")
                      : ""
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "json":
      return (
        <FormField
          {...commonProps}
          render={({ field: fieldProps }) => (
            <FormItem className="col-span-2">
              <FormLabel>{getFieldLabel(field)}</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(event) => fieldProps.onChange(event.target.value)}
                  placeholder={field.placeholder}
                  value={
                    typeof fieldProps.value === "string"
                      ? fieldProps.value
                      : fieldProps.value
                        ? JSON.stringify(fieldProps.value, null, 2)
                        : ""
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    default:
      return null;
  }
}

function renderFieldsByGroup(
  fields: FieldConfig[],
  group: string,
  control: any,
  form: any,
  protocolData: any
) {
  const groupFields = fields.filter((field) => field.group === group);
  if (groupFields.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      {groupFields.map((field) => (
        <DynamicField
          control={control}
          field={field}
          form={form}
          key={field.name}
          protocolData={protocolData}
        />
      ))}
    </div>
  );
}

function renderGroupCard(
  title: string,
  fields: FieldConfig[],
  group: string,
  control: any,
  form: any,
  protocolData: any
) {
  const groupFields = fields.filter((field) => field.group === group);
  if (groupFields.length === 0) return null;

  const visibleFields = groupFields.filter(
    (field) => !field.condition || field.condition(protocolData, {})
  );

  if (visibleFields.length === 0) return null;

  return (
    <div className="relative">
      <fieldset className="rounded-lg border border-border">
        <legend className="ml-3 bg-background px-1 py-1 font-medium text-foreground text-sm">
          {title}
        </legend>
        <div className="p-4 pt-2">
          {renderFieldsByGroup(fields, group, control, form, protocolData)}
        </div>
      </fieldset>
    </div>
  );
}

const buildSchema = (t: TFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t("errors.nameRequired", "Please enter a name")),
    server_id: z
      .number({ message: t("errors.serverRequired", "Please select a server") })
      .int()
      .gt(0, t("errors.serverRequired", "Please select a server"))
      .optional(),
    protocol: z
      .string()
      .min(1, t("errors.protocolRequired", "Please select a protocol")),
    address: z
      .string()
      .trim()
      .min(1, t("errors.serverAddrRequired", "Please enter an entry address")),
    port: z
      .number({
        message: t("errors.portRange", "Port must be between 1 and 65535"),
      })
      .int()
      .min(1, t("errors.portRange", "Port must be between 1 and 65535"))
      .max(65_535, t("errors.portRange", "Port must be between 1 and 65535")),
    tags: z.array(z.string()),
    enabled: z.boolean().default(true).optional(),
    protocol_config: z.record(z.string(), z.any()).optional(),
  });

export type NodeFormValues = z.infer<ReturnType<typeof buildSchema>>;

function normalizeValues(v?: Partial<NodeFormValues>): Partial<NodeFormValues> {
  if (!v) return {};
  return { ...v, tags: Array.isArray(v.tags) ? v.tags : [] };
}

export default function NodeForm(props: {
  trigger: string;
  title: string;
  loading?: boolean;
  initialValues?: Partial<NodeFormValues>;
  onSubmit: (values: NodeFormValues) => Promise<boolean> | boolean;
}) {
  const { trigger, title, loading, initialValues, onSubmit } = props;
  const { t } = useTranslation("nodes");
  const Scheme = useMemo(() => buildSchema(t), [t]);
  const [open, setOpen] = useState(false);

  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(
    new Set()
  );
  const [accordionValue, setAccordionValue] = useState<string>();
  const removeAutoFilledField = (fieldName: string) => {
    setAutoFilledFields((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
  };

  const PROTOCOL_FIELDS = useProtocolFields();

  const form = useForm<NodeFormValues>({
    resolver: zodResolver(Scheme),
    defaultValues: {
      name: "",
      server_id: undefined,
      protocol: "",
      address: "",
      port: 0,
      tags: [],
      protocol_config: {},
      enabled: true,
      ...normalizeValues(initialValues),
    },
  });
  form.watch("server_id");
  const protocol = form.watch("protocol") as ProtocolType;
  const protocolConfig = useWatch({
    control: form.control,
    name: "protocol_config",
  });

  const { servers } = useServer();
  const { tags } = useNode();

  const existingTags: string[] = tags || [];
  const availableProtocols = protocols
    .map((p) => ({ protocol: p, port: 0 }))
    .sort((a, b) => a.protocol.localeCompare(b.protocol));
  const protocolFields = PROTOCOL_FIELDS[protocol] || [];

  useEffect(() => {
    if (initialValues) {
      const initVals = normalizeValues(initialValues);
      const proto = initVals.protocol || protocol;
      const defaultConfig = proto
        ? getProtocolDefaultConfig(proto as ProtocolType)
        : {};
      const existingConfig = initVals.protocol_config || {};
      const allowedKeys = Object.keys(defaultConfig);
      const filteredConfig: Record<string, any> = {};
      allowedKeys.forEach((key) => {
        if (existingConfig[key] !== undefined) {
          filteredConfig[key] = existingConfig[key];
        }
      });
      const mergedConfig = { ...defaultConfig, ...filteredConfig };
      if (proto) {
        mergedConfig.type = proto;
      }
      form.reset({
        name: "",
        server_id: undefined,
        protocol: "",
        address: "",
        port: 0,
        tags: [],
        enabled: true,
        ...initVals,
        protocol_config: mergedConfig,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  useEffect(() => {
    if (protocol) {
      const defaultConfig = getProtocolDefaultConfig(protocol);
      const currentConfig = form.getValues("protocol_config") || {};
      const mergedConfig = { ...defaultConfig, type: protocol };
      if (currentConfig.enable !== undefined) {
        mergedConfig.enable = currentConfig.enable;
      }
      if (mergedConfig.enable === undefined) {
        mergedConfig.enable = true;
      }
      form.setValue("protocol_config", mergedConfig, { shouldDirty: false });
      setAccordionValue(protocol);
    } else {
      form.setValue("protocol_config", {}, { shouldDirty: false });
      setAccordionValue(undefined);
    }
  }, [protocol]);

  function handleServerChange(nextId?: number | null) {
    const id = nextId ?? undefined;
    form.setValue("server_id", id);

    if (!id) {
      setAutoFilledFields(new Set());
      return;
    }

    const selectedServer = servers.find((s) => s.id === id);
    if (!selectedServer) return;

    const currentValues = form.getValues();
    const fieldsToFill: string[] = [];

    if (!currentValues.name || autoFilledFields.has("name")) {
      form.setValue("name", selectedServer.name as string, {
        shouldDirty: false,
      });
      fieldsToFill.push("name");
    }

    if (!currentValues.address || autoFilledFields.has("address")) {
      form.setValue("address", selectedServer.address as string, {
        shouldDirty: false,
      });
      fieldsToFill.push("address");
    }

    setAutoFilledFields(new Set(fieldsToFill));
  }

  const handleManualFieldChange = (
    fieldName: keyof NodeFormValues,
    value: any
  ) => {
    form.setValue(fieldName, value);
    removeAutoFilledField(fieldName);
  };

  function handleProtocolChange(nextProto?: ProtocolName | null) {
    const proto = (nextProto || "") as ProtocolName | "";
    form.setValue("protocol", proto);
    removeAutoFilledField("protocol");
  }

  async function handleSubmit(values: NodeFormValues) {
    const result = await onSubmit(values);
    if (result) {
      setOpen(false);
      setAutoFilledFields(new Set());
    }
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button
          onClick={() => {
            const initVals = normalizeValues(initialValues);
            const proto = initVals.protocol;
            const defaultConfig = proto
              ? getProtocolDefaultConfig(proto as ProtocolType)
              : {};
            const existingConfig = initVals.protocol_config || {};
            const allowedKeys = Object.keys(defaultConfig);
            const filteredConfig: Record<string, any> = {};
            allowedKeys.forEach((key) => {
              if (existingConfig[key] !== undefined) {
                filteredConfig[key] = existingConfig[key];
              }
            });
            const mergedConfig = { ...defaultConfig, ...filteredConfig };
            if (proto) {
              mergedConfig.type = proto;
            }
            form.reset({
              name: "",
              server_id: undefined,
              protocol: "",
              address: "",
              port: 0,
              tags: [],
              enabled: true,
              ...initVals,
              protocol_config: mergedConfig,
            });
            setAutoFilledFields(new Set());
            if (proto) {
              setAccordionValue(proto);
            } else {
              setAccordionValue(undefined);
            }
          }}
        >
          {trigger}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[700px] max-w-full gap-0 md:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100dvh-48px-36px-36px-env(safe-area-inset-top))]">
          <Form {...form}>
            <form className="grid grid-cols-1 gap-4 px-6 pt-4">
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="server_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("server", "Server")}</FormLabel>
                      <FormControl>
                        <Combobox<number, false>
                          onChange={(v) => handleServerChange(v)}
                          options={servers.map((s) => ({
                            value: s.id,
                            label: `${s.name} (${(s.address as any) || ""})`,
                          }))}
                          placeholder={t("select_server", "Select server…")}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="protocol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("protocol", "Protocol")}</FormLabel>
                      <FormControl>
                        <Combobox<string, false>
                          onChange={(v) =>
                            handleProtocolChange((v as ProtocolName) || null)
                          }
                          options={availableProtocols.map((p) => ({
                            value: p.protocol,
                            label: p.protocol,
                            children: (
                              <span
                                className={`rounded border px-2 py-0.5 text-xs ${PROTOCOL_COLORS[p.protocol] || "border-gray-200 bg-gray-100 text-gray-700"}`}
                              >
                                {p.protocol}
                              </span>
                            ),
                          }))}
                          placeholder={t("select_protocol", "Select protocol…")}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name", "Name")}</FormLabel>
                      <FormControl>
                        <EnhancedInput
                          {...field}
                          onValueChange={(v) =>
                            handleManualFieldChange("name", v as string)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("address", "Address")}</FormLabel>
                      <FormControl>
                        <EnhancedInput
                          {...field}
                          onValueChange={(v) =>
                            handleManualFieldChange("address", v as string)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("port", "Port")}</FormLabel>
                      <FormControl>
                        <EnhancedInput
                          {...field}
                          max={65_535}
                          min={1}
                          onValueChange={(v) =>
                            handleManualFieldChange("port", Number(v))
                          }
                          placeholder="1-65535"
                          type="number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("enabled", "Enabled")}</FormLabel>
                      <FormControl>
                        <div className="pt-2">
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(checked)
                            }
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {protocol && (
                <div className="my-3">
                  <h3 className="font-semibold text-foreground text-sm">
                    {t("protocol_configuration", "Protocol Configuration")}
                  </h3>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {t(
                      "protocol_configuration_desc",
                      "Configure the selected protocol settings"
                    )}
                  </p>
                </div>
              )}

              {protocol && (
                <Accordion
                  className="w-full space-y-3"
                  collapsible
                  onValueChange={setAccordionValue}
                  type="single"
                  value={accordionValue}
                >
                  <AccordionItem
                    className="mb-2 rounded-lg border"
                    key={protocol}
                    value={protocol}
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1">
                            <span className="font-medium capitalize">
                              {protocol}
                            </span>
                            <Badge
                              className={`border text-xs ${PROTOCOL_COLORS[protocol] || "border-gray-200 bg-gray-100 text-gray-700"}`}
                            >
                              {protocol}
                            </Badge>
                            {protocolConfig?.transport && (
                              <Badge className="text-xs" variant="secondary">
                                {protocolConfig.transport.toUpperCase()}
                              </Badge>
                            )}
                            {protocolConfig?.security &&
                              protocolConfig.security !== "none" && (
                                <Badge className="text-xs" variant="outline">
                                  {protocolConfig.security.toUpperCase()}
                                </Badge>
                              )}
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <span className="text-muted-foreground text-xs">
                            {protocolConfig?.enable !== false
                              ? t("enabled_on", "Enabled")
                              : t("enabled_off", "Disabled")}
                          </span>
                          <Switch
                            checked={protocolConfig?.enable !== false}
                            onCheckedChange={(v) =>
                              form.setValue("protocol_config.enable", v, {
                                shouldDirty: true,
                              })
                            }
                          />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-0 pb-4">
                      <div className="-mx-4 space-y-4 rounded-b-lg border-t px-4 pt-4">
                        {renderGroupCard(
                          t("basic", "Basic Configuration"),
                          protocolFields,
                          "basic",
                          form.control,
                          form,
                          protocolConfig
                        )}
                        {renderGroupCard(
                          t("obfs", "Obfuscation"),
                          protocolFields,
                          "obfs",
                          form.control,
                          form,
                          protocolConfig
                        )}
                        {renderGroupCard(
                          t("transport", "Transport"),
                          protocolFields,
                          "transport",
                          form.control,
                          form,
                          protocolConfig
                        )}
                        {renderGroupCard(
                          t("security", "Security"),
                          protocolFields,
                          "security",
                          form.control,
                          form,
                          protocolConfig
                        )}
                        {renderGroupCard(
                          t("reality", "Reality"),
                          protocolFields,
                          "reality",
                          form.control,
                          form,
                          protocolConfig
                        )}
                        {renderGroupCard(
                          t("encryption", "Encryption"),
                          protocolFields,
                          "encryption",
                          form.control,
                          form,
                          protocolConfig
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tags", "Tags")}</FormLabel>
                    <FormControl>
                      <TagInput
                        onChange={(v) => form.setValue(field.name, v)}
                        options={existingTags}
                        placeholder={t(
                          "tags_placeholder",
                          "Use Enter or comma (,) to add multiple tags"
                        )}
                        value={field.value || []}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        "tags_description",
                        "Permission grouping tag (incl. plan binding and delivery policies)."
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <SheetFooter className="flex-row justify-end gap-2 pt-3">
          <Button
            disabled={loading}
            onClick={() => setOpen(false)}
            variant="outline"
          >
            {t("cancel", "Cancel")}
          </Button>
          <Button
            disabled={loading}
            onClick={form.handleSubmit(handleSubmit, (errors) => {
              const key = Object.keys(errors)[0] as keyof typeof errors;
              if (key) toast.error(String(errors[key]?.message));
              return false;
            })}
          >
            {t("confirm", "Confirm")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
